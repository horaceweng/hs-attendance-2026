Kindergarten System Migration Guide

Overview

This document describes how to port four local changes from the HS attendance system to a separate `kindergarten_system` codebase. The goal is to ensure pending/approved leave requests appear in the attendance summary and to avoid creating default "present" attendance records that block leave visibility. It covers frontend and backend edits, DTO/API shapes, environment tips, and verification steps.

Files and changes to port

1) StudentManagementTab hook-order fix (frontend)
- Problem: Conditional early-return prevented React hooks from running, leaving the component stuck on a loading state.
- Fix: Ensure hooks (useEffect) always run by moving early-return that shows loading after hooks or rendering loading UI but not skipping hooks.
- Patch template (React):
  - Ensure useEffect calls are not inside conditional returns.
  - If you used `if (loading) return <Loading />`, instead render `loading` UI inside JSX while keeping useEffect present.

2) ReportPage (frontend) changes
- Problem: Multi-select status caused ambiguity; backend expects `statuses?: string[]` but frontend sent comma-separated string or different shape. Also, need to clarify UI text and to allow leave requests (pending/approved) to override attendance records.
- Fix: Switch status selector to single-select and send `statuses: filters.status ? [filters.status] : undefined` in API calls. Add caption describing how `present` is derived by exclusion.
- Patch template: change the MUI Select from `multiple` to single, update state to `status: string`, and ensure the API call uses an array when present.

3) AttendancePage submit default behavior (frontend)
- Problem: Submitting daily attendance created implicit `present` records for all students not selected as exception, which prevented later leave requests from being visible.
- Fix: Only submit explicit exceptions (absent/late/leave_early). Do not create records for 'present'.
- Patch template: Filter the submission payload to exclude `present` statuses before calling API.

4) Backend: report precedence change (reports.service)
- Problem: When both an attendanceRecord and a leaveRequest exist for the same student/date, the attendance record (often default 'present') hid the leave request.
- Fix: In the report generation logic, prefer leaveRequests with status `pending|approved` over attendanceRecords when choosing final status for a student/date.
- Patch template (Prisma / TypeScript):
  - Query attendanceRecords and leaveRequests for the same date range.
  - Build a map keyed by studentId+date. Insert attendance records first, then overwrite with leaveRequests having approved/pending states.
  - When producing final rows, use leaveRequest data if present; otherwise use attendanceRecord; otherwise assume `present`.

API / DTO notes
- Backend endpoint `GET /reports/attendance` should accept `statuses?: string[]` (query param can be comma-separated from frontend helpers). Confirm controller DTO and guards accept optional `statuses`.
- Pending / approved leave statuses should be filtered in the backend query: Prisma `where: { status: { in: ['approved', 'pending'] } }`.

Environment & verification tips
- Ensure `DATABASE_URL` points to the correct local DB when testing. Unset any exported remote `DATABASE_URL` in your shell (`unset DATABASE_URL`) or explicitly run with the correct env for the diagnostic runs.
- If MySQL credentials contain special chars (e.g., @), URL-encode them in DATABASE_URL.
- Restart backend and frontend after applying patches.

Smoke test (manual)
1. Start backend with correct local DB
2. Start frontend
3. Create a pending leave request for student A on date D
4. Ensure there is no explicit 'present' attendance record for student A on date D (or ensure the attendance submit logic won't create one)
5. Generate the attendance report for date D and confirm student A shows `請假 (...) - 待審核` or similar
6. Approve the leave and confirm status updates; also test an attendance record existing + leave request case to ensure leave wins

Verification script (optional)
- Provide a small ts-node script that queries Prisma and raw SQL for a date to compare results (adapt from existing debug script in HS repo).

Kindergarten-specific adjustments
- Wording: replace '班級' with '班級 / 教保組' where appropriate; adjust age ranges, and captions to mention parents and guardians if needed.
- Attendance semantics in kindergarten: often half-day or session-based; consider extending DTOs to allow `session: 'morning'|'afternoon'` if kindergarten uses sessions.

Next steps
- Locate the `kindergarten_system` repo (path or Git URL). If you provide it here I will scan and create adapted patch files.
- I can also generate ready-to-apply patch files for the target repo once I can inspect it.

