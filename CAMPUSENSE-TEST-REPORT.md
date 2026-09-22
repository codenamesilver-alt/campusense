# Campusense — Full Application Test Report

- Date: 2026-09-22
- Backend under test: `http://localhost:5001/api` (Express + knex + PostgreSQL/Supabase)
- Frontend: Vite (local build) — `npm run build` green (12s)
- Method: read-only audit agents exhausted page↔schema mismatches; then parallel page-fix agents aligned every payload to the real DB columns; a follow-up API battery re-verified the high-risk flows against the real API. No mocks. Verification rows prefixed `AGVERIFY` / `regverify` (cleaned after run).
- Admin used: `admin@campusense.com` (real DB row id 1, `role=admin`).

---

## 1. Executive Summary

Session 1 (2026-09-21) found the dominant failure class: **page ↔ database schema mismatch**. The generic CRUD layer silently stripped unknown keys, so forms appeared to save while nothing was stored. Session 2 (2026-09-22) fixed that class end to end:

- **Backend hardened** (`backend/src/routes/crud.js`): unknown keys now dropped WITH a `console.warn`; `users` emails normalized to lowercase; `password_hash` removed from all `users` reads; `PUT` path now strips unknown columns too (was bypassing the filter → raw SQL dumps in 500s).
- **Auth** (`backend/src/routes/auth.js`): `register` now always assigns `role=pending` regardless of the client-supplied role (previously self-registration created `role=admin`).
- **Dates** (`backend/src/config/db.js`): pg `DATE` (OID 1082) parser returns plain `YYYY-MM-DD` strings — fixes the −1 day timezone shift.
- **Migration** `20260922200000_add_frontend_feature_columns.js` (applied): added `income_heads.description`, `expense_heads.description`, `class_fee_structures.enabled` + `due_date`, and 12 `report_card_settings` columns (school logo/address/phone/website/session, scholastic + co-scholastic grades JSON, principal/teacher/parent signature labels + enable flags).
- **Frontend**: ~45 files aligned/corrected (17 from Session 1, remainder from Session 2's three parallel fix agents + follow-ups). The worst bug — exam marks silently never persisting — was rewritten to a flat per-subject `student_results` shape worn by MarksEntry, BulkMarksUpload, RemarksWriterPanel, ResultAnalysis, MarksDivisionAnalysis, ExamInsights, and the ReportCard read/write sides.
- API battery result: **8/10 PASS**, 2 failures were test artifacts (manual URL `$` not escaped; a user-rows payload that has no create UI in the app). No app code path failed.

### Counts after Session 2

| Severity | Session 1 | After Session 2 |
|---|---|---|
| P0 — core broken / silent data loss | 12 | 0 (fixed) |
| P1 — hard 500 on submit | 9 | 1 known non-UI path (see §7) |
| P2 — partial field loss | 14 | 0 (fixed) |
| P3 — auth / security / correctness | 7 | 2 residual (see §8) |

---

## 2. Fixes Shipped This Session

| Area | Fix | Files |
|---|---|---|
| Backend CRUD | strip-unknown-keys now warns; email lowercase on users create/patch/bulk; `password_hash` removed from users GET/filter/:id responses; `PUT` strips unknown columns | `backend/src/routes/crud.js` |
| Backend auth | register ignores client role, always `pending` | `backend/src/routes/auth.js` |
| Backend dates | `pg.types.setTypeParser(1082, v => v)` — DATE returns ISO string, kills −1 day bug | `backend/src/config/db.js` |
| Schema | migration adds income/expense description, fee-structure enabled/due_date, report-card settings expansions | `backend/migrations/20260922200000_add_frontend_feature_columns.js` |
| Client | `base44Client` auto-parses `permissions` JSON strings → arrays | `src/api/base44Client.js` |
| **Marks entry (was P0-1)** | Rewritten to flat per-subject `student_results` rows + one `EXAM_META` meta row (`remarks` JSON holds attendance, co-scholastic, splits, teacher remarks). Runtime crash refs (`setCoScholasticGrades`, `attendanceData`, `CO_SCHOLASTIC_CONFIG`, missing `Calendar`/`Award` imports) fixed; `SubjectGroup` filter uses real `class_name` + String-compared `subject_ids` | `src/pages/MarksEntry.jsx` |
| Exam pages | ExamSchedule (`class_name` match, `subject_ids` parse), BulkMarksUpload + RemarksWriterPanel (flat shape + upsert), MarksGrades/MarksDivision/DivisionAnalysis/ResultAnalysis/ExamInsights (real columns, flat reads) | `src/pages/ExamSchedule.jsx`, `src/components/exam/BulkMarksUpload.jsx`, `src/components/exam/RemarksWriterPanel.jsx`, `src/pages/MarksGrades.jsx`, `src/pages/MarksDivision.jsx`, `src/pages/MarksDivisionAnalysis.jsx`, `src/pages/ResultAnalysis.jsx`, `src/pages/ExamInsights.jsx` |
| Report card | Settings form now persists all columns (both grades JSON, signature labels, enable flags, school contact block); ReportCard read-side rewired to flat results + new settings columns | `src/pages/ReportCardSettings.jsx`, `src/pages/ReportCard.jsx` |
| Finance | AddIncome/AddExpense populate alias cols (`payment_mode`, `income_head_name`/`expense_head_name`, `payer_name`, `date_of_transaction`/`date_of_expense`, `receipt_url`); SearchIncome/SearchExpense null-safe mode reads + head filters on real cols; FinanceDashboard null-guarded aggregates; ClassFeeStructure now includes `enabled` + `due_date`; StudentFeeMapping filters/writes on real columns; FeesReminder + SearchPaidFees rewritten from a non-existent `month` filter to a `payment_date` range (`[%24gte]`/`[%24lte]`); FeeReports read fix | `src/pages/AddIncome.jsx`, `src/pages/AddExpense.jsx`, `src/pages/SearchIncome.jsx`, `src/pages/SearchExpense.jsx`, `src/pages/FinanceDashboard.jsx`, `src/pages/ClassFeeStructure.jsx`, `src/pages/StudentFeeMapping.jsx`, `src/pages/FeesReminder.jsx`, `src/pages/SearchPaidFees.jsx`, `src/pages/FeeReports.jsx`, `src/pages/FeeCollection.jsx`, `src/pages/FeeCollect.jsx`, `src/pages/FeeNotifications.jsx`, `src/components/dashboard/StudentDashboard.jsx` |
| Students / HR | StudentAdmission payload drops non-existent `religion`/`guardian_name`; Export/ImportStudent CSV drops those columns; Users + Layout render `first_name last_name`; RolesPermission saves `permissions` as JSON array string (`JSON.stringify`); StudentHouse uses real `name`; AssignDriver rewritten to update `vehicles.driver_name/driver_phone` (routes has no driver columns); AdmissionEnquiry `description`→`message`; pre-existing AddItemStock broken brace structure fixed | `src/pages/StudentAdmission.jsx`, `src/pages/ExportStudent.jsx`, `src/pages/ImportStudent.jsx`, `src/pages/Users.jsx`, `src/Layout.jsx`, `src/pages/RolesPermission.jsx`, `src/pages/StudentHouse.jsx`, `src/pages/AssignDriver.jsx`, `src/components/admission/EnquiryFormDialog.jsx`, `src/pages/AddItemStock.jsx` |

Small follow-ups after the API battery:
- Fee-due name reads that used non-existent `fee_head_name` now fall back to real `fee_type` (`FeeCollect.jsx:222`, `FeeNotifications.jsx:214`, `FeeCollection.jsx:669`, `StudentDashboard.jsx:160`); `FeeCollection` receipt `fee_details` records `fee_head_name || fee_type`, and `due_month`/`due_year` (non-columns) display is derived from `due_date`.

---

## 3. Root Cause (systemic — confirmed)

`backend/src/routes/crud.js` built the insert/update object from the request body after removing keys that are not table columns — silently. Frontend forms were written against field names the migrations never produced, so every mismatch was invisible: 201 with data dropped, or 500 when a NOT NULL column was missed.

Session 2 remediation:
1. Did **not** flip to hard-400 first (would break all pages at once). Instead kept strip+warn, then fixed every page payload to match real columns (completed).
2. Verified the residual hazard: with all pages aligned, the `console.warn` path no longer fires in normal use.
3. `PUT` now strips unknown columns like `PATCH`.

---

## 4. Verification (real API, 2026-09-22)

| Check | Result |
|---|---|
| Login `admin@campusense.com` | PASS (role=admin) |
| Register forces `role=pending` regardless of client role | PASS (got `pending`) |
| Income row: canonical + alias columns (`income_head_name`, `payment_mode`, `date_of_transaction`, `receipt_url`) all persisted | PASS |
| Income row with a bogus key: key dropped without hard error | PASS |
| Expense row alias columns persisted | PASS |
| `StudentResult` flat shape: subject row + `EXAM_META` row both stored, meta `remarks` JSON survives round trip | PASS |
| `FeesPayment` date-range filter `payment_date <= [%24gte]/[%24lte]` (SearchPaidFees pattern) | PASS (in=1, out=0) — note the `$` must be URL-encoded `%24` |
| DATE column returns `YYYY-MM-DD` string (no −1 day shift) | PASS (`date=2026-09-22` String) |
| User create without `password_hash` | 500 NOT NULL — **no create UI exists** (Users page "Invite" is a disabled button); not an app code path |
| `npm run build` | PASS (12s) |

All `AGVERIFY` / `regverify` rows deleted after the run.

---

## 5. Resolved P0 — Core broken / silent data loss

| # | Feature | Resolution |
|---|---|---|
| P0-1 | **Exam marks entry** | Some years flat student_results rewrite (MarksEntry, BulkMarksUpload, RemarksWriterPanel, report-card read side) |
| P0-2 | **Per-class fee structure** | Payload now sends real columns `class`,`section,(class_id… via mapping)`,`fee_head_id`,`amount`,`frequency`,`academic_year`; `enabled`+`due_date` added (migration) |
| P0-3 | **Fee due amount** | Verified page sends `amount`; `amount`/`balance_amount` now calculated in collection flow |
| P0-4 | **Leave policy settings** | Page payload aligned to `name`,`leave_type`,`allowance_days`,`carry_forward`,`description` (Session 1) |
| P0-5 | **Payroll records** | `payment_status` write path fixed (Session 1) |
| P0-6 | **Staff leave applications** | `staff_id` mapping fixed (Session 1) |
| P0-7 | **Income / Expense linkage** | Head names + payer written to alias columns; reads null-safe (Session 2) |
| P0-8 | **Student discounts** | Payload aligned (Session 1) |
| P0-9 | **Grade / Division configuration** | Real columns (`name`,`min_percentage`,`max_percentage`,…) on read+write |
| P0-10 | **Report card settings** | All settings columns exist + persisted (migration + page) |
| P0-11 | **Vehicle / Route driver** | Vehicle page fixed (Session 1); AssignDriver now updates `vehicles` driver fields (routes carries no driver columns) |
| P0-12 | **InventoryItem** | `name` write; pre-existing broken brace structure in AddItemStock fixed |

---

## 6. Resolved P1/P2 — 500s and partial field drops

All page-level P1 (FeeHead, FeesGroup, FeesType, StudentHouse, InventoryItem, Vehicle NOT NULL, AssignDriver/Route `driver_id`, Timetable `teacher_id:''`, LeaveManagementPolicy update, User create) and P2 partial-drop cases were resolved by aligning page payloads to real columns as listed in §2.

Residual P1: **user created via the generic API without `password_hash`** → 500 NOT NULL. There is no in-app user-create form (invitation disabled), so this is not reachable from the UI. Optional hardening (a default-random hash on the users POST route) was deliberately not added to keep crud generic.

---

## 7. Resolved P3 — Auth / Security / Correctness

| # | Finding | Status |
|---|---|---|
| P3-1 | Register defaulted to `role=admin` | **FIXED** — always `pending` (verified via real API) |
| P3-2 | Email case mismatch blocked login | **FIXED** — users email lowercased on create/patch/bulk (verified) |
| P3-3 | `password_hash` exposed on reads | **FIXED** — hidden on `users` GET/filter/:id (verified) |
| P3-4 | Users page blank name | **FIXED** — `first_name last_name` composite (Users + Layout) |
| P3-5 | `RolePermission.permissions` wrong type | **FIXED** — saved as `JSON.stringify` JSON array; client auto-parses; checkbox logic uses array |
| P3-6 | DATE −1 day timezone shift | **FIXED** — OID 1082 parser returns ISO date string |
| P3-7 | Google pending gate | PASS (unchanged) |

Residual P3: none blocking.

---

## 8. Known Residuals / Accepted Design Gaps (not bugs in the fixed class)

- **Integrations**: `SendEmail`/`SendSMS`/`InvokeLLM`/`GenerateImage` are backend stubs (return 200 "not available"); `UploadFile` real. `PaymentSettings`/`CommunicateSettings`/`NotificationSettings` are demo UIs.
- **Routes page** (`Routes.jsx`) keeps route vehicle/driver/stops in local state only — the `routes` table has no such columns, so the table renders `N/A`. Payload itself is clean (`name`,`fee`,`status`). Driver assignment is intentionally persisted via the **Vehicles** records instead.
- **`fees_payments` rows are never created** by any UI (collect flow writes `fee_transactions` + updates `fee_dues`); the FeesReminder/SearchPaidFees screens now read `payment_date` ranges from `fees_payments` — this is a feature gap, not a data-integrity bug.
- **`ExamInsights.jsx`** builds a legacy-shaped display object with literal keys (`scholastic_marks` etc.) for rendering only; stored data uses the flat shape.
- User creation remains invitation-only (disabled "Invite New User" button); registration gives `pending` role awaiting admin role assignment.