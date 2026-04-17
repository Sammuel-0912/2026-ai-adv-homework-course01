# CHANGELOG.md

本文件記錄專案的重要變更，遵循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 格式。

---

## [1.0.0] — 2026-04-17

### 新增

- **用戶認證系統**
  - 用戶註冊（POST /api/auth/register）
  - 用戶登入（POST /api/auth/login），回傳 JWT（7 天有效）
  - 個人資料查詢（GET /api/auth/profile）
  - bcrypt 密碼加密（10 salt rounds）

- **商品系統**
  - 商品列表（GET /api/products）含分頁（page/limit）
  - 單一商品詳情（GET /api/products/:id）
  - 8 種花卉種子商品

- **購物車（雙模式）**
  - 支援 JWT 認證（已登入用戶）
  - 支援 X-Session-Id header（訪客）
  - 加入/更新/刪除購物車項目
  - 加入已存在商品時累加數量

- **訂單系統**
  - 從購物車建立訂單（含庫存扣除 Transaction）
  - 訂單項目快照商品名稱與價格
  - 用戶訂單列表與詳情查詢
  - 模擬付款（pending → paid / failed）

- **管理員後台**
  - 商品 CRUD（新增、更新、刪除、列表）
  - 刪除商品時防止刪除有待付款訂單的商品
  - 訂單列表（支援 status 篩選）
  - 訂單詳情（含用戶資訊）

- **前端（EJS + Vue.js 3）**
  - 首頁商品列表
  - 商品詳情頁
  - 購物車頁
  - 結帳頁
  - 訂單歷史與詳情頁
  - 管理員商品管理頁
  - 管理員訂單管理頁
  - Toast 通知元件

- **測試套件**
  - auth / products / cart / orders / adminProducts / adminOrders
  - 循序執行，防止資料庫競爭

- **開發工具**
  - OpenAPI 3.0.3 文件自動產生（swagger-jsdoc）
  - Tailwind CSS v4 建置流程
  - SQLite WAL 模式啟用

---

## 未來版本規劃

- ECPay 綠界金流真實整合
- 商品搜尋與分類篩選
- 訂單 Email 通知
- 用戶訂單取消（pending 狀態）
- 管理員庫存預警
- Rate limiting 防護
