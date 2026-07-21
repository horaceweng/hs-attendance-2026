# 部署指南(Deployment Guide)

本文件說明如何將學生出缺勤系統部署到免費雲端方案組合:

- **後端**:Render Web Service(免費方案)
- **前端**:Render Static Site(免費方案)
- **資料庫**:TiDB Cloud Serverless(免費方案)

在動手操作前,建議先閱讀 `backend/.env.example`,文件中的環境變數名稱與說明皆以該檔案為準。

---

## 1. 架構總覽

```
瀏覽器
  │
  ▼
Render Static Site(前端, React + Vite build)
  │  以 VITE_API_BASE_URL 建置時注入的網址呼叫 API
  ▼
Render Web Service(後端, NestJS)
  │  以 DATABASE_URL 連線
  ▼
TiDB Cloud Serverless(MySQL 協議相容)
```

- 前端是純靜態檔案(`vite build` 產出的 `dist/`),由 Render Static Site 提供,瀏覽器端直接對後端網域發出 API 請求(無伺服器端渲染、無 proxy)。
- 後端是 NestJS 應用,監聽 Render 動態注入的 `PORT`,對外提供 REST API,並透過 Prisma 連線 TiDB。
- 後端與前端是兩個獨立的 Render 服務,各自有自己的網址(如 `https://xxx-backend.onrender.com`、`https://xxx-frontend.onrender.com`),需要互相告知對方網址(前端用 `VITE_API_BASE_URL` 指向後端;後端用 `FRONTEND_URL` 把前端網址加入 CORS 允許清單)。
- 資料庫是外部託管的 TiDB Cloud Serverless,後端以標準 MySQL 連線字串(`DATABASE_URL`)透過 TLS 連線,Prisma `provider = "mysql"` 不需更動。

---

## 2. TiDB Cloud Serverless 設定步驟

1. 前往 TiDB Cloud 官網註冊帳號(可用 Google/GitHub 等第三方帳號快速註冊)。
2. 建立一個 **Serverless** 類型的 cluster(免費方案的儲存與運算額度、連線數上限等,請以 TiDB Cloud 官網當前公告的方案內容為準,避免文件記載的數字隨時間過時失準)。
3. Cluster 建立完成後,在連線設定頁面取得連線資訊,組合出符合下列格式的連線字串(對照 `backend/.env.example` 的說明):

   ```
   mysql://<user>:<password>@<host>:4000/<database>?sslaccept=strict
   ```

   - `<user>`、`<password>`:TiDB Cloud 提供的帳密(密碼通常只在建立時顯示一次,請妥善保存,遺失需重置)。
   - `<host>`:TiDB Cloud 提供的 endpoint 網址。
   - `4000`:TiDB 預設埠號。
   - `<database>`:欲使用的資料庫名稱(可在連線後自行建立,或依 TiDB Cloud 介面指引建立)。
   - `sslaccept=strict`:TiDB Cloud Serverless 要求 TLS 連線,這是 `.env.example` 中已註記的參數;若 TiDB Cloud 官方文件當下提供其他建議參數,請以官方文件為準。
4. 建議在 TiDB Cloud 的網路/安全設定中確認是否需要額外設定(例如 IP 允許清單、公開網路存取開關),依當前介面指引操作即可;Render Web Service 對外連線通常使用動態 IP,若 TiDB Cloud 提供「Allow Access from Anywhere」之類的選項,可視安全需求評估是否啟用,或改用 TiDB 提供的其他連線方式。
5. 取得的完整連線字串會用在:
   - 後端 Render Web Service 的 `DATABASE_URL` 環境變數(見第 3 節)。
   - GitHub repo 的 `DATABASE_URL` secret(用於手動觸發 `db-migrate-seed.yml`,見第 3 節「首次部署後執行 migrate/seed」)。

---

## 3. 後端 Render Web Service 設定步驟

1. 在 Render 建立一個新的 **Web Service**,並連接本專案的 GitHub repo。
2. 服務設定中,將 **Root Directory** 指定為 `backend/`(因為本 repo 是前後端合併在同一個 repo 的 monorepo 結構)。
3. **Build Command**:

   ```
   npm install && npm run build
   ```

   （`backend/package.json` 的 `build` script 內容為 `prisma generate && nest build`，會一併產生 Prisma Client。）

4. **Start Command**:

   ```
   npm run build && npm run start:prod
   ```

   （`start:prod` 對應 `backend/package.json` 中的 `"start:prod": "node dist/main"`。**務必在 Start Command 裡再跑一次 build**,原因見下方「已知問題」。）

   > **已知問題:僅在 Build Command 跑 build 會導致 `Cannot find module '.../dist/main'`**
   >
   > Render 的 Node.js(非 Docker)服務會在一個 build 容器執行 Build Command,再把結果「打包上傳」到實際執行 Start Command 的容器。這個打包步驟會參考 `.gitignore`——而 `backend/.gitignore` 有 `/dist`(避免編譯產物進 git 是對的做法),導致打包上傳時 `dist/` 被濾掉,build log 會顯示 `Build successful 🎉`,但啟動時卻找不到 `dist/main.js`。
   >
   > 解法就是讓 build 動作發生在「實際要執行的容器」裡,所以 Start Command 要包含 `npm run build`。NestJS 編譯很快,重複執行不影響部署時間太多。

5. **環境變數**(對照 `backend/.env.example` 逐一設定,於服務設定的環境變數區塊新增):

   | 變數名稱 | 說明 |
   | --- | --- |
   | `DATABASE_URL` | 第 2 節取得的 TiDB 連線字串(含 `?sslaccept=strict`) |
   | `JWT_SECRET` | 簽章金鑰,見第 6 節產生方式,**務必為隨機值,不可留空或使用弱值** |
   | `JWT_EXPIRES_IN` | 可選,JWT 過期時間,例如 `1d`;未設定時由程式決定預設值 |
   | `PORT` | **不需手動設定**,Render 會自動注入,`backend/src/main.ts` 已改為讀取 `process.env.PORT ?? 3001` |
   | `DEFAULT_USER_PASSWORD` | seed 時所有使用者的初始密碼(明碼,會在 seed script 中雜湊後寫入),部署前請自行設定一個非預設的值 |
   | `FRONTEND_URL` | 前端 Render Static Site 的實際網址,用於 CORS 允許清單(可逗號分隔多個來源) |

6. 儲存設定並觸發首次部署。部署完成後,確認 `GET https://<你的後端網址>/health` 能回傳 200 與 `{ status, timestamp }`(對應 `backend/src/app.controller.ts` 的 `/health` 端點)。

7. **首次部署後執行資料庫 migration 與 seed**:

   後端服務本身的啟動指令(`start:prod`)只會啟動應用程式,不會自動執行 `prisma migrate deploy` 或 seed。需要以下列其中一種方式手動執行:

   - **方式一:Render 的 Shell 功能**:在 Render 服務頁面開啟 Shell(或 One-Off Job),於 `backend/` 目錄下依序執行:

     ```
     npx prisma migrate deploy --schema=prisma/schema.prisma
     npx prisma db seed --schema=prisma/schema.prisma
     ```

   - **方式二:GitHub Actions workflow**:本 repo 的 `.github/workflows/db-migrate-seed.yml` 已設定為 `workflow_dispatch`(僅手動觸發),會讀取 GitHub repo secret `DATABASE_URL` 並依序執行 `prisma generate`、`prisma migrate deploy`、`prisma db seed`。使用前需先在 GitHub repo 的 Settings → Secrets 中手動新增/更新 `DATABASE_URL` secret 為 TiDB 連線字串,再到 Actions 頁面手動觸發此 workflow。

   兩種方式擇一即可;若日後 schema 有新的 migration,同樣需要重新執行 `prisma migrate deploy`(seed 通常只需初次執行,重複執行前請確認 `prisma/seed.ts` 的行為是否會覆蓋既有資料)。

---

## 4. 前端 Render Static Site 設定步驟

1. 在 Render 建立一個新的 **Static Site**,連接同一個 GitHub repo。
2. **Root Directory** 指定為 `frontend/`。
3. **Build Command**:

   ```
   npm install && npm run build
   ```

   （`frontend/package.json` 的 `build` script 為 `tsc -b && vite build`。）

4. **Publish Directory**:

   ```
   dist
   ```

5. **環境變數**:新增 `VITE_API_BASE_URL`,值設為後端 Render Web Service 的網址(例如 `https://xxx-backend.onrender.com`,不含結尾斜線)。這個變數是**建置時**注入(Vite 的環境變數機制),修改後需要重新觸發 build 才會生效,對應 `frontend/src/services/api.ts` 中 `baseURL` 的讀取邏輯。

6. **設定 Response Headers(CSP)**:`frontend/index.html` 中的 `<meta http-equiv="Content-Security-Policy">` 只是開發環境用的預設值(僅允許 `http://localhost:3001`)。正式環境請在 Render Static Site 的服務設定中找到「Response Headers」設定區塊,新增一筆 `Content-Security-Policy` header,內容需將 `connect-src` 指向實際的後端網址,例如:

   ```
   default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://xxx-backend.onrender.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;
   ```

   透過 Render dashboard 設定的 Response Header 會覆蓋 HTML 中的 `<meta>` CSP(瀏覽器以較嚴格/後到的 CSP 為準,實務上以 HTTP header 設定為主要來源)。若後端網址變更,記得同步更新此處。

---

## 5. 免費方案限制與注意事項

- **Render Web Service(後端)免費方案休眠**:服務在一段時間無流量後會進入休眠,下一次請求需要「冷啟動」喚醒服務,可能需要數十秒(實際休眠閒置時間與冷啟動時長請以 Render 官網當前免費方案說明為準,曾觀察到約 30-60 秒的冷啟動時間,僅供參考)。
  - `backend/src/app.controller.ts` 提供的 `GET /health` 端點可用於健康檢查;若要避免使用者在冷啟動時等待過久,可考慮串接符合 Render 服務條款的監控/告警服務(例如僅用於「服務是否存活」的健康檢查),但**不建議**以高頻率排程請求刻意讓服務保持喚醒狀態去規避免費方案的休眠機制,這類用法可能違反 Render 服務條款,請先確認條款內容再決定是否設定外部監控。
- **TiDB Serverless 免費方案限制**:儲存空間、連線數、運算單位(Request Unit)等額度請參考 TiDB Cloud 官網當前方案頁面,文件不記載具體數字以避免過時。若應用出現連線被拒或效能異常,建議先檢查是否觸及當前方案額度。
- **前端 Static Site**:免費方案通常沒有休眠問題(純靜態檔案由 CDN 提供),但仍建議確認 Render 當前對 Static Site 免費方案的頻寬/建置時數等限制。

---

## 6. JWT_SECRET 產生方式

`JWT_SECRET` 用於簽署與驗證登入後的 JWT token,**務必使用足夠長度的隨機字串**,不可留空、不可使用預設值或猜得到的字串(例如 `secret`、`123456` 等)。

可用下列指令產生一組安全的隨機值(以 macOS/Linux 終端機為例):

```
openssl rand -base64 48
```

將輸出結果複製貼到 Render 後端服務的 `JWT_SECRET` 環境變數。

- 正式環境與開發/測試環境應使用不同的 `JWT_SECRET`。
- 若懷疑金鑰外洩,應立即更換(輪替)新的隨機值,並注意所有已簽發的 JWT 都會因金鑰變更而失效(等同強制所有使用者重新登入)。

---

## 7. 部署後驗證清單

- [ ] 後端健康檢查:`GET https://<後端網址>/health` 回傳 HTTP 200,body 包含 `status` 與 `timestamp`。
- [ ] 後端環境變數皆已設定:`DATABASE_URL`、`JWT_SECRET`、`DEFAULT_USER_PASSWORD`、`FRONTEND_URL`(`JWT_EXPIRES_IN` 可選)。
- [ ] 已對 TiDB 執行過 `prisma migrate deploy`,且資料表已建立成功(可透過 Render Shell 或 TiDB Cloud 的 SQL 介面確認)。
- [ ] 已執行過 seed,至少有一組可登入的帳號存在。
- [ ] 前端能成功開啟登入頁,並使用 seed 建立的帳號成功登入(驗證 `VITE_API_BASE_URL` 設定正確、前後端網路可通)。
- [ ] 瀏覽器開發工具的 Console/Network 沒有 CORS 錯誤(驗證後端 `FRONTEND_URL` 的 CORS 允許清單確實包含前端實際網域,含 `https://` 開頭與正確的網域名稱)。
- [ ] 瀏覽器開發工具沒有 CSP 違規錯誤(驗證 Render Static Site 的 Response Headers 中 `Content-Security-Policy` 的 `connect-src` 確實指向後端實際網址)。
- [ ] 登入後可正常呼叫需要驗證的 API(例如班級列表、出缺勤登記),確認 JWT 簽發/驗證流程正常。
- [ ] 冷啟動情境測試:等待後端服務閒置一段時間後,重新發出請求,確認服務會自動喚醒並在合理時間內回應(非永久性錯誤)。

---

## 8. 已知待驗證事項(TiDB 相容性)

以下項目在 [Issue #29](../../issues/29) 的靜態相容性檢查中已完成程式碼層面的分析,但**尚未對真實 TiDB 連線做過實際驗證**,部署後請留意:

1. **Foreign Key 約束**:現有 migrations 皆使用資料庫層外鍵(`schema.prisma` 未設定 `relationMode`,預設為 `"foreignKeys"`)。TiDB 自 v6.6 起支援 FK,TiDB Cloud Serverless 理論上應已支援,但實際版本/功能開關需要在執行 `prisma migrate deploy` 時才能確認是否報錯。若不支援,需要改為 `relationMode = "prisma"` 並移除 migration 中的 `ADD CONSTRAINT ... FOREIGN KEY`,屬於較大改動。
2. **`@db.Year` 型別**:`Class.schoolYear`、`StudentClassEnrollment.schoolYear`、`AcademicYear.year` 皆使用 Prisma 的 `@db.Year` 型別。需要在真實 TiDB 連線下跑過一次 migration 與 Prisma Client 讀寫,確認 YEAR 型別序列化行為正常。
3. **Collation/Charset**:所有資料表建表時指定 `DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`。TiDB 自 v4.0 起支援新版 collation 框架,理論上支援 `utf8mb4_unicode_ci`,但中文姓名的排序/比對行為建議用真實資料驗證一次。
4. **`LAST_INSERT_ID()` 的連線親和性風險**:`backend/src/academic/academic.service.ts` 的 `createHoliday()` 使用兩次獨立的 `$executeRaw`(INSERT)與 `$queryRaw`(`SELECT LAST_INSERT_ID()`),未包在 `$transaction` 內,隱含「兩次呼叫共用同一條連線」的假設。TiDB Serverless 採用 proxy/gateway 分派連線,此風險可能更明顯,建議連線後做併發測試驗證正確性。
5. **AUTO_INCREMENT 非嚴格遞增/有缺口**:目前程式碼未發現依賴嚴格連續遞增 ID 的邏輯,但 TiDB 的自增鍵分配(尤其多節點 + `AUTO_ID_CACHE`)可能產生非連續、非嚴格遞增的值,日後新增功能時不應假設 ID 遞增順序等同建立時間順序。

若上述任一項目在真實連線後發現問題,請另開 issue 追蹤修正,不建議在沒有真實連線驗證的情況下臆測性修改 schema 或程式邏輯。
