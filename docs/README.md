# 花卉電商平台後端

一個使用 Node.js + Express.js 建構的花卉電商後端，提供完整 REST API 與伺服器端渲染頁面，涵蓋商品瀏覽、購物車、訂單流程與管理員後台。

## 技術棧

| 層級 | 技術 |
|------|------|
| 執行環境 | Node.js |
| Web 框架 | Express.js ~4.16.1 |
| 資料庫 | SQLite3 + better-sqlite3 v12.8.0（WAL 模式）|
| 驗證 | jsonwebtoken v9.0.2（HS256，7 天有效期）|
| 密碼加密 | bcrypt v6.0.0（10 salt rounds）|
| 模板引擎 | EJS v5.0.1 |
| 前端框架 | Vue.js 3（CDN global build）|
| CSS | Tailwind CSS v4.2.2 |
| 唯一識別碼 | UUID v11.1.0 |
| 測試 | Vitest v2.1.9 + Supertest v7.2.2 |
| API 文件 | swagger-jsdoc v6.2.8 |

## 快速開始

```bash
# 1. 安裝相依套件
npm install

# 2. 建立 .env 檔案
cp .env.example .env
# 編輯 .env，至少設定 JWT_SECRET

# 3. 啟動服務（會自動建置 CSS 並初始化資料庫）
npm start

# 服務啟動後，前往 http://localhost:3001
# 預設管理員帳號：admin@hexschool.com / 12345678
```

## 常用指令

| 指令 | 說明 |
|------|------|
| `npm start` | 建置 CSS + 啟動伺服器 |
| `npm run dev:server` | 僅啟動伺服器（不重建 CSS）|
| `npm run dev:css` | 監聽 CSS 變更（開發時搭配 dev:server 使用）|
| `npm run css:build` | 建置並壓縮 Tailwind CSS |
| `npm test` | 執行完整測試套件（循序）|
| `npm run openapi` | 產生 openapi.json 文件 |

## 環境變數

| 變數 | 說明 | 必要 | 預設值 |
|------|------|------|--------|
| `JWT_SECRET` | JWT 簽名密鑰 | 是 | — |
| `PORT` | 伺服器埠號 | 否 | 3001 |
| `BASE_URL` | 後端服務 URL | 否 | http://localhost:3001 |
| `FRONTEND_URL` | 前端 URL（CORS 設定）| 否 | http://localhost:5173 |
| `ADMIN_EMAIL` | 預設管理員帳號 | 否 | admin@hexschool.com |
| `ADMIN_PASSWORD` | 預設管理員密碼 | 否 | 12345678 |
| `NODE_ENV` | 執行環境 | 否 | development |
| `ECPAY_MERCHANT_ID` | 綠界特店編號 | 否（付款未實作）| 3002607 |
| `ECPAY_HASH_KEY` | 綠界 HashKey | 否 | — |
| `ECPAY_HASH_IV` | 綠界 HashIV | 否 | — |
| `ECPAY_ENV` | 綠界環境 | 否 | staging |

## 文件索引

| 文件 | 說明 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系統架構、目錄結構、API 路由、資料庫 Schema、認證機制 |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 開發規範、命名規則、新增模組步驟、計畫歸檔流程 |
| [FEATURES.md](./FEATURES.md) | 功能清單、完成狀態、業務邏輯說明 |
| [TESTING.md](./TESTING.md) | 測試規範、測試檔案說明、撰寫新測試指南 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本更新日誌 |
