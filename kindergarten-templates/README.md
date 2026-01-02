Kindergarten Migration Patch Templates

This folder contains portable patch templates and notes to apply the HS attendance fixes to another repo (e.g., `kindergarten_system`). Use these as guidance or adapt them directly to your target repository structure.

Files:
- `frontend/ReportPage.patch` — patch template for changing status selector to single-select and ensuring API call uses `statuses: [status]`.
- `frontend/AttendancePage.patch` — patch template to submit only non-`present` exceptions.
- `frontend/StudentManagementTab.patch` — patch template for hook-order fix.
- `backend/reports_service.patch` — patch template to prefer leaveRequests over attendanceRecords in generated report.
- `apply_instructions.md` — instructions for applying these patches (git apply / manual edits) and verification steps.
