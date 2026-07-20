# HS Attendance System - Copilot 指引（繁體中文）

本文件提供給 AI coding agents，目標是「快速理解專案脈絡、避免破壞既有業務規則、用最小修改完成需求」。

## 1. 專案全貌

這是前後端分離的出缺勤系統：
- 後端：NestJS + Prisma + MySQL（資料模型與規則核心）
- 前端：React + Vite + MUI（頁面流程與操作體驗）
- 核心業務軸線：班級點名、請假申請/審核、報表統計、學年學期管理

重要邊界：
- 後端模組位於 `backend/src/*`（auth/attendance/leaves/reports/statistics/academic/students/classes/users）
- 資料模型位於 `backend/prisma/schema.prisma`
- 前端 API 封裝在 `frontend/src/services/api.ts`，頁面在 `frontend/src/pages/*`

## 2. 高優先業務規則（修改前必讀）

### 2.1 請假優先於出缺勤
報表邏輯中，同一學生同一天若同時存在：
- attendanceRecord
- leaveRequest（pending 或 approved）

最終狀態必須以請假為準（on_leave），不可被 attendanceRecord 覆蓋。

### 2.2 每日點名不得建立隱含的 present 紀錄
點名提交時只應送出「有變更且非 on_leave」的資料。
不要為每個學生自動建立 present，否則會干擾請假在報表中的可見性。

### 2.3 AttendanceRecord 唯一鍵
`AttendanceRecord` 使用 `(studentId, attendanceDate)` 唯一約束。
新增/更新點名應採用 upsert 思維，避免重複插入。

## 3. 開發環境與常用指令

### 3.1 後端（在 backend 目錄）
- 安裝：`npm install`
- 開發：`npm run dev` 或 `npm run start:dev`
- 建置：`npm run build`
- 測試：`npm run test` / `npm run test:e2e` / `npm run test:cov`
- Lint：`npm run lint`

### 3.2 前端（在 frontend 目錄）
- 安裝：`npm install`
- 開發：`npm run dev`
- 建置：`npm run build`
- 預覽：`npm run preview`
- Lint：`npm run lint`

### 3.3 Prisma / DB（在 backend 目錄）
- 產生 client：`npx prisma generate`
- 建立 migration：`npx prisma migrate dev --name <name>`
- seed：`npx prisma db seed`

## 4. 環境變數與啟動注意事項

### 4.1 後端必要項
- `DATABASE_URL`：MySQL 連線字串
- `JWT_SECRET`：JWT 驗簽金鑰（未設置可能導致啟動失敗）

### 4.2 後端可選項
- `SKIP_DB_CONNECT=true`：略過啟動時 DB 連線（CI/建置環境常用）
- `PRISMA_STRICT_CONNECT=true`：DB 初始連線失敗時直接拋錯
- `JWT_EXPIRES_IN`：JWT 過期時間

### 4.3 前端可選項
- `VITE_API_BASE_URL`：API 基底 URL（未設時預設 `http://localhost:3001`）

## 5. 後端實作慣例

### 5.1 模組結構
每個功能通常有：
- `<feature>.module.ts`
- `<feature>.controller.ts`
- `<feature>.service.ts`
- `dto/*`

### 5.2 DTO 與型別轉換
- 使用 class-validator / class-transformer
- 全域 `ValidationPipe({ transform: true, enableImplicitConversion: true })`
- 查詢參數常用逗號字串轉陣列（例如 statuses、grades）

### 5.3 驗證與授權
- 認證：`AuthGuard('jwt')`
- 角色：`RolesGuard` + `@Roles(...)`
- 班級權限：`ClassAccessGuard`
  - `GA_specialist` 可直接通過
  - `teacher` 需存在有效 `teacherClassAssignment`

### 5.4 錯誤處理
- 優先使用 Nest 例外（NotFoundException / ForbiddenException / HttpException）
- 避免吞錯；若 catch，需保留足夠上下文

## 6. 前端實作慣例

### 6.1 API 存取集中管理
- 所有 HTTP 呼叫走 `frontend/src/services/api.ts`
- 不要在頁面直接散落 axios 呼叫

### 6.2 認證流程
- token 存在 `localStorage.access_token`
- request interceptor 自動帶 `Authorization: Bearer <token>`
- response interceptor 對 401/403 清 token 並導回 login（保留 returnUrl）

### 6.3 路由與權限顯示
- `ProtectedRoute` 控制登入狀態
- 部分導覽項目依角色顯示（例如 GA_specialist 顯示系統管理）

## 7. 日期與時間處理規範

- 主要以 `YYYY-MM-DD` 作為日期交換格式
- 後端比對日期時應標準化（常見作法：`setUTCHours(0,0,0,0)`）
- `LeaveRequest` 可支援整天或部分時段（startTime / endTime）
- 修改日期邏輯時要特別注意時區副作用

## 8. 變更策略（給 AI agent）

### 8.1 先找再改
先定位既有邏輯與關聯模組，再做最小範圍修補：
- attendance 變更通常連動 reports / leaves
- auth 變更通常連動 guards / frontend auth service
- schema 變更一定連動 migration、DTO、service、frontend 型別與 API 呼叫

### 8.2 避免大面積重構
此專案存在不少「為修正特定情境加入的註解/偵錯輸出」。
除非需求明確，請不要順手大規模清理或改寫整段流程。

### 8.3 優先補測試的區域
目前關鍵業務（報表覆寫、權限、點名提交）容易回歸，若改到這些區塊：
- 至少補一個對應案例（單元或整合）
- 或在 PR/回覆中明確提供可重現的手動驗證步驟

## 9. 常見任務的安全執行清單

### 9.1 新增 API 欄位
1) 更新 Prisma schema（若涉及 DB）
2) 建 migration 並驗證
3) 更新 DTO validation / transform
4) 更新 service 查詢與回傳
5) 更新 frontend api.ts 型別與頁面使用
6) 驗證舊流程不破壞（登入、點名、請假、報表）

### 9.2 調整報表條件
1) 先確認 statuses/grades 參數格式（陣列 vs 逗號字串）
2) 驗證 leave 覆寫 attendance 規則仍成立
3) 以同一學生同一天「有請假也有點名」做回歸測試

### 9.3 調整權限
1) 確認 JWT payload 欄位（`sub`、`role`）
2) 檢查 `AuthGuard`、`RolesGuard`、`ClassAccessGuard` 的連鎖效果
3) 前端導覽與 ProtectedRoute 是否同步行為

## 10. 已知風險與技術債

- 目前登入密碼驗證仍為開發模式（明文/固定密碼語意），非正式生產安全方案
- 測試覆蓋仍有限，改動核心規則時要主動補測或補驗證步驟
- 日期與時區邏輯分散，修改時需以端到端情境驗證

---

如果你是 AI agent：
- 先用搜尋確認現況，再做最小必要變更
- 任何牽涉 attendance / leaves / reports 的改動，都要把「請假優先」當成不可破壞規則
- 完成後至少執行對應 lint/test 或提供明確未執行原因與手動驗證步驟
