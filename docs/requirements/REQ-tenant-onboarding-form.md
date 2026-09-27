# REQ-tenant-onboarding-form — Tenant Onboarding Form

- **Decision:** dec-go-1 ("Go")
- **Parent:** cr-onboarding-form — Onboarding Form
- **Project:** prj-maternal-project

## Summary

When a hospital (tenant) signs up for the first time, the person signing up fills in a form with their own contact details, their hospital's details, and the hospital's current yearly activity counts (USGs, deliveries, caesareans, NICU admissions, MTPs). These counts become the hospital's **baseline**. The platform then compares the counts it actually records in the app against this baseline, and alerts the Super Admin each time a count reaches double, triple, and so on.

## Who uses it

- **Tenant (the person signing up, who becomes Hospital Admin):** fills in and submits the form at first sign-up.
- **Super Admin:** views the submitted form, corrects the counts if needed, and receives the multiple-of-baseline alerts.

## When it appears

- At the tenant's **first sign-up**, as part of hospital onboarding.
- The government/registration certificate upload is **not required** at first sign-up. The tenant can upload it later. Per the blueprint's onboarding flow, Super Admin ratification still depends on this certificate, so ratification cannot complete until it is uploaded.

## Fields

### Contact person (all mandatory)
| Field | Rules |
|---|---|
| Contact person name | Text, required |
| Phone | Required, valid phone number |
| Email | Required, valid email address |

### Hospital (mandatory unless noted)
| Field | Rules |
|---|---|
| Hospital name | Text, required |
| Address | Text, required |
| Registration number | Text, required |
| Registration certificate upload | **Optional at sign-up**; can be uploaded later from the hospital profile |

### Current activity counts (all mandatory)
| Field | Rules |
|---|---|
| Period covered (months) | Whole number, required, **minimum 12**. The tenant should enter the longest period for which figures are available (one year or more). |
| No. of USGs | Whole number ≥ 0, required |
| No. of deliveries | Whole number ≥ 0, required. **Includes caesareans.** |
| No. of caesareans | Whole number ≥ 0, required. Must be ≤ No. of deliveries (a subset of deliveries). |
| No. of NICU admissions | Whole number ≥ 0, required |
| No. of MTPs | Whole number ≥ 0, required |

All counts are totals for the stated period and are self-declared by the tenant.

## Validation

- The form cannot be submitted until every mandatory field is valid.
- If the period is under 12 months, show: "Enter figures for at least 12 months."
- If caesareans exceed deliveries, show: "Caesareans are part of deliveries and cannot be more than the number of deliveries."

## After submission

- The contact and hospital details, apart from the certificate, follow normal profile rules.
- **The activity counts and period are locked after submission.** The tenant and Hospital Admin cannot edit them. Only the Super Admin can correct them, and each correction is logged (old value, new value, who, when).
- The certificate can be uploaded after submission until it is provided.

## Baseline and alerts (downstream)

1. **Baseline per count:** yearly baseline = declared count ÷ period in months × 12. This is calculated for each of the five counts.
2. **Actual count:** for each count, the platform counts the matching events recorded in the app for this tenant over the **last 12 months** (rolling):
   - USGs: USG registrations/reports recorded
   - Deliveries: confirmed deliveries (normal and caesarean)
   - Caesareans: deliveries flagged LSCS
   - NICU admissions: deliveries/admissions flagged NICU
   - MTPs: MTPs recorded in the app (see Notes)
3. **Alert rule:** when an actual count first reaches **2×** its baseline, the **Super Admin** is alerted. The Super Admin is alerted again at **3×**, **4×**, and so on. Each multiple fires **once per count per tenant**.
4. **Alert content:** tenant/hospital name, which count, baseline value, actual value, and the multiple reached (e.g. "Deliveries: 3× baseline — baseline 400/yr, actual 1,210 in last 12 months").
5. Alerts go only to the Super Admin. The tenant is not notified.
6. If a baseline is 0, no multiple can be calculated for that count, so no alert fires for it.

The alerts support the Super Admin's subscription/billing oversight, for example the blueprint's "Double Delivery Figure" / "Original Delivery Averages" model. This requirement covers only recording the baseline and raising alerts. Changing any billing amount is out of scope.

## Out of scope

- Super Admin ratification workflow (existing onboarding flow)
- Department, package and rate-list setup (later onboarding steps)
- Billing calculation changes triggered by alerts

## Notes

- The blueprint does not currently describe an MTP workflow. The MTP baseline is captured now, but MTP alerts can only work once the app records MTPs.

## Clarifications incorporated

- qna q1: contact and hospital fields listed above
- qna q2: counts cover a period of at least one year, more if available
- qna q3: NICU = NICU admissions
- qna q4: deliveries include caesareans (caesareans are a subset)
- qna q5: form is completed at first sign-up; the certificate can be uploaded later
- qna q6: counts feed downstream alerts at 2×, 3×, …
- Follow-up (2026-09-27): comparison uses actual app counts over the last 12 months; alerts go to Super Admin only; counts are locked after submission (Super Admin can correct them); all fields except the certificate are mandatory
