# WI-tenant-onboarding-form — Tenant Onboarding Form: Implementation Plan

- **Requirement:** [REQ-tenant-onboarding-form](../requirements/REQ-tenant-onboarding-form.md) ([mock](../requirements/REQ-tenant-onboarding-form/mock.md))
- **Application:** web-ui (covers both `apps/frontend` and `apps/backend`)
- **Stack:** React + Vite + TypeScript (frontend), Node.js + Express + TypeScript (backend), Turso (libSQL) database

## Scope

In scope:
- Onboarding form: contact details, hospital details, activity counts and period
- Saving the submission and locking the counts once submitted
- Super Admin correction of counts, with an audit log
- Yearly baseline calculation per count
- Monthly job that compares actual counts with the baselines and raises in-app alerts to the Super Admin at 2×, 3×, …
- Screens: onboarding form, hospital profile (read-only counts), Super Admin alert list and correction form

Out of scope (per qna answers):
- **Login/auth and RBAC:** a separate feature, to be built later (qna q3). Endpoints here are unauthenticated for now; see Risks.
- **Multi-tenancy:** one shared database, with hospitals as rows (qna q4). No per-tenant databases yet.
- **Registration certificate upload:** not needed now (qna q8). No Firebase integration in this Work Item.
- **Email/SMS delivery of alerts:** alerts are in-app only, matching the requirement mock.

## Backend (`apps/backend`)

### Module layout (qna q7: separate module)

```
apps/backend/src/
  index.ts                      # existing; mount router + start scheduler
  db/
    client.ts                   # Turso/libSQL client from env
    migrate.ts                  # runs SQL migrations at startup
    migrations/001_onboarding.sql
  modules/onboarding/
    onboarding.routes.ts        # Express router
    onboarding.service.ts       # validation, lock rule, baseline math
    onboarding.repo.ts          # SQL queries
    onboarding.types.ts
    baseline.ts                 # pure functions: yearlyBaseline(), multipleReached()
    alerts.job.ts               # monthly job
    activity-counts.provider.ts # interface for "actual counts" (see Risks)
```

`baseline.ts` and the alert rules stay free of Express and database code, following the Architectural Boundary in `docs/techstack.md`.

### Dependencies

- `@libsql/client`: Turso client (qna q6)
- `node-cron`: in-process monthly scheduler (qna q5)
- `cors`, or a Vite dev proxy instead (see Frontend)

### Configuration

- `TURSO_DATABASE_URL`: use `file:local.db` for local development and the Turso URL in deployed environments
- `TURSO_AUTH_TOKEN`: required for remote Turso only
- Add a `.env.example` listing both (`.env` is already gitignored)

### Data model (`001_onboarding.sql`)

```sql
CREATE TABLE hospitals (
  id              TEXT PRIMARY KEY,          -- uuid
  contact_name    TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,
  contact_email   TEXT NOT NULL,
  hospital_name   TEXT NOT NULL,
  address         TEXT NOT NULL,
  registration_no TEXT NOT NULL,
  created_at      TEXT NOT NULL
);

CREATE TABLE hospital_baselines (
  hospital_id     TEXT PRIMARY KEY REFERENCES hospitals(id),
  period_months   INTEGER NOT NULL CHECK (period_months >= 12),
  usgs            INTEGER NOT NULL CHECK (usgs >= 0),
  deliveries      INTEGER NOT NULL CHECK (deliveries >= 0),
  caesareans      INTEGER NOT NULL CHECK (caesareans >= 0 AND caesareans <= deliveries),
  nicu_admissions INTEGER NOT NULL CHECK (nicu_admissions >= 0),
  mtps            INTEGER NOT NULL CHECK (mtps >= 0),
  locked_at       TEXT NOT NULL              -- set on submit; counts are locked from then on
);

CREATE TABLE baseline_corrections (          -- audit log; never deleted
  id            TEXT PRIMARY KEY,
  hospital_id   TEXT NOT NULL REFERENCES hospitals(id),
  field         TEXT NOT NULL,               -- e.g. 'deliveries', 'period_months'
  old_value     INTEGER NOT NULL,
  new_value     INTEGER NOT NULL,
  corrected_by  TEXT NOT NULL,               -- free text until RBAC exists
  corrected_at  TEXT NOT NULL
);

CREATE TABLE baseline_alerts (
  id            TEXT PRIMARY KEY,
  hospital_id   TEXT NOT NULL REFERENCES hospitals(id),
  metric        TEXT NOT NULL,               -- usgs | deliveries | caesareans | nicu_admissions | mtps
  multiple      INTEGER NOT NULL,            -- 2, 3, 4, ...
  baseline      REAL NOT NULL,               -- yearly baseline at time of alert
  actual        INTEGER NOT NULL,            -- actual count, last 12 months
  created_at    TEXT NOT NULL,
  read_at       TEXT,
  UNIQUE (hospital_id, metric, multiple)     -- each multiple fires once per metric per hospital
);
```

### API (REST, JSON)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/onboarding` | Submit the form. Validates, creates `hospitals` + `hospital_baselines` rows in one transaction, and sets `locked_at`. Returns `{ id }`. |
| `GET` | `/api/hospitals/:id` | Hospital profile with its locked baseline counts |
| `PATCH` | `/api/admin/hospitals/:id/baseline` | Super Admin correction. Body: changed fields + `correctedBy`. Writes one `baseline_corrections` row per changed field in the same transaction. |
| `GET` | `/api/admin/hospitals/:id/baseline/corrections` | Correction history |
| `GET` | `/api/admin/alerts` | Alert list, newest first (`?unread=true` filter) |
| `POST` | `/api/admin/alerts/:id/read` | Mark an alert as read |
| `POST` | `/api/admin/alerts/run` | Run the monthly check on demand (for testing and ops) |

There is no endpoint for a tenant to update counts, which enforces the lock. Only the `/api/admin/...` correction route changes them.

### Validation (server side; the frontend mirrors it)

- All fields are required. The phone and email formats must be valid.
- All counts must be whole numbers ≥ 0.
- `period_months` ≥ 12. Error message: "Enter figures for at least 12 months."
- `caesareans` ≤ `deliveries`. Error message: "Caesareans are part of deliveries and cannot be more than the number of deliveries."
- Errors come back as `400 { errors: { field: message } }` so the form can show them inline.

### Baseline and alert logic (`baseline.ts`, `alerts.job.ts`)

- `yearlyBaseline(count, periodMonths) = count / periodMonths * 12`
- `multipleReached(actual, baseline)` = `floor(actual / baseline)` when `baseline > 0`, otherwise none (no alert for a zero baseline)
- Monthly job (`node-cron`, 1st of each month at 02:00 server time):
  1. For each hospital, get the actual counts for the last 12 months from `ActivityCountsProvider`.
  2. For each metric where the multiple reached is ≥ 2, insert one alert for **every** multiple from 2 up to the one reached that hasn't fired yet. `INSERT OR IGNORE` on the unique key makes reruns safe.
  3. Log a summary line (hospitals checked, alerts created).

### `ActivityCountsProvider`

```ts
interface ActivityCountsProvider {
  countsForLast12Months(hospitalId: string): Promise<{
    usgs: number; deliveries: number; caesareans: number;
    nicuAdmissions: number; mtps: number;
  }>;
}
```

This Work Item ships a `ZeroActivityCountsProvider` that returns 0 for everything, because no delivery, USG, NICU or MTP recording exists in the app yet. When the Delivery & Admission and USG modules are built, they provide the real implementation. See Risks.

## Frontend (`apps/frontend`)

- Add `react-router-dom` for routes:
  - `/onboarding`: onboarding form (mock screen 1)
  - `/hospitals/:id`: hospital profile with read-only counts (mock screen 2, without the certificate block)
  - `/admin/alerts`: Super Admin alert list (mock screen 3), with a link to a correction form per hospital
- After a successful submit, navigate to `/hospitals/:id`.
- The form shows a warning before submit: "Activity figures cannot be changed after you submit."
- Put client-side validation in a shared `validateOnboarding()` function that mirrors the server rules. Server errors are mapped onto the same inline messages.
- Add a Vite dev proxy (`server.proxy['/api'] → http://localhost:3000`) so the frontend calls relative `/api/...` paths and needs no CORS setup. The existing `App.tsx` health check calls `http://localhost:3000/health` directly; switch it to the proxy too.
- New files (suggested): `src/api/onboarding.ts`, `src/pages/OnboardingForm.tsx`, `src/pages/HospitalProfile.tsx`, `src/pages/admin/Alerts.tsx`, `src/pages/admin/BaselineCorrection.tsx`, `src/lib/validateOnboarding.ts`

## Testing

- Unit tests (`vitest`, both apps): `yearlyBaseline`, `multipleReached` (including a zero baseline and exact multiples), and validation rules
- Backend integration tests against `file::memory:` libSQL:
  - Submitting creates a locked baseline.
  - A correction writes audit rows.
  - Running the alert job twice with the same counts creates no duplicate alerts.
  - A count jump from 1× to 3× creates both the 2× and 3× alerts.
- Test the alert job with a fake `ActivityCountsProvider`.

## Risks and assumptions

1. **No auth yet (qna q3).** All routes, including `/api/admin/*`, are open until the RBAC feature lands. Keep the admin routes on a separate router so a guard can be added in one place later. Do not deploy publicly as is.
2. **Alerts won't fire in practice yet.** Actual counts depend on delivery, USG, NICU and MTP recording, which doesn't exist. The zero provider keeps the job wired up and testable. The requirement also notes that the blueprint has no MTP workflow.
3. **Single database, no tenant isolation (qna q4).** This goes against the "multi-tenant by default" principle in `docs/techstack.md`. Moving to per-tenant databases later means moving `hospital_baselines` and `baseline_corrections`. `baseline_alerts` stays platform-level, since the Super Admin reads it across all hospitals.
4. **In-process cron.** If the backend runs more than one instance, each would run the job. The unique key prevents duplicate alerts, but a single scheduler (or an external trigger for `/api/admin/alerts/run`) is needed at scale.
5. **Certificate upload deferred (qna q8).** The requirement makes ratification depend on the certificate. That flow needs a later Work Item once Firebase is set up.
6. **`correctedBy` is free text** until identity exists. Replace it with the authenticated user id once RBAC is in place.

## Clarifications incorporated (WI qna)

- q1: React frontend (apps/frontend)
- q2: TypeScript/Node.js backend. Both apps are in this Work Item.
- q3: login and auth not included; built later with RBAC
- q4: multi-tenancy ignored for now; single database
- q5: alert check runs as a monthly job
- q6: Turso (libSQL) database
- q7: onboarding is a separate module inside apps/backend
- q8: certificate upload not needed now
