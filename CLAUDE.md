# CLAUDE.md

學生出缺勤系統(前後端分離)。詳細業務規則與慣例見 `.github/copilot-instructions.md` — 其中「高優先業務規則」(請假優先於出缺勤、點名不得自動建立 present、AttendanceRecord 以 (studentId, attendanceDate) upsert)為不可破壞的規則。

## 架構

- `backend/` — NestJS + Prisma + MySQL(相容 TiDB Serverless)。模組:auth / attendance / leaves / reports / statistics / academic / students / classes / users。資料模型在 `backend/prisma/schema.prisma`。
- `frontend/` — React + Vite + MUI。API 一律走 `src/services/api.ts`,頁面在 `src/pages/`。

## 常用指令

後端(於 `backend/`):`npm run start:dev`、`npm run build`、`npm run lint`、`npm test`、`npx prisma generate|migrate dev|db seed`
前端(於 `frontend/`):`npm run dev`、`npm run build`、`npm run lint`

## 環境變數

後端必要:`DATABASE_URL`、`JWT_SECRET`;其餘見 `backend/.env.example`。前端:`VITE_API_BASE_URL`。

## 慣例

- 註解與文件使用繁體中文;不留「編輯日誌型」註解(如「修正後版本」)。
- 日期交換格式 `YYYY-MM-DD`,後端比對用 `setUTCHours(0,0,0,0)` 標準化。
- 授權:`AuthGuard('jwt')` + `RolesGuard` + `@Roles(...)`;班級權限用 `ClassAccessGuard`。
- 部署:後端 Render Web Service、前端 Render Static Site、DB TiDB Cloud Serverless,見 `DEPLOYMENT.md`(建立後)。
