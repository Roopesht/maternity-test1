# REQ-tenant-onboarding-form — Mock

## Tenant first sign-up: onboarding form

```
+--------------------------------------------------------------------+
|  Welcome! Tell us about you and your hospital                      |
+--------------------------------------------------------------------+
|  CONTACT PERSON                                                    |
|  Name *          [______________________________]                  |
|  Phone *         [______________]                                  |
|  Email *         [______________________________]                  |
|                                                                    |
|  HOSPITAL                                                          |
|  Hospital name * [______________________________]                  |
|  Address *       [______________________________]                  |
|                  [______________________________]                  |
|  Registration no. * [________________]                             |
|  Registration certificate   [ Upload file ]  (optional now -       |
|                              can be uploaded later)                |
|                                                                    |
|  CURRENT ACTIVITY  (enter the longest period you have, min 1 yr)   |
|  Period covered (months) *  [ 12 ]                                 |
|  No. of USGs *              [______]                               |
|  No. of deliveries *        [______]  (includes caesareans)        |
|  No. of caesareans *        [______]                               |
|  No. of NICU admissions *   [______]                               |
|  No. of MTPs *              [______]                               |
|                                                                    |
|  (!) Activity figures cannot be changed after you submit.          |
|                                                                    |
|                                              [ Submit ]            |
+--------------------------------------------------------------------+
  Errors shown inline, e.g.
  No. of caesareans  [ 520 ]  x Cannot be more than deliveries (400)
```

## Hospital profile after submission (tenant view)

```
+--------------------------------------------------------------+
|  Hospital profile                                            |
+--------------------------------------------------------------+
|  Registration certificate:  NOT UPLOADED  [ Upload now ]     |
|  (Required for Super Admin ratification)                     |
|                                                              |
|  Activity baseline (locked)                                  |
|   Period 24 months | USGs 3,000 | Deliveries 800             |
|   Caesareans 300   | NICU 120   | MTPs 60                    |
+--------------------------------------------------------------+
```

## Super Admin: baseline alerts

```
+--------------------------------------------------------------+
|  ALERTS                                                      |
+--------------------------------------------------------------+
|  [!] City Care Hospital - Deliveries at 2x baseline          |
|      Baseline 400/yr   Actual 812 (last 12 months)           |
|      2026-09-27 10:15                  [ View tenant ]       |
|--------------------------------------------------------------|
|  [!] Sunrise Maternity - NICU admissions at 3x baseline      |
|      Baseline 40/yr    Actual 125 (last 12 months)           |
+--------------------------------------------------------------+
```
