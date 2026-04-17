# CHANGELOG.md

本文件記錄專案的重要變更，遵循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 格式。

---

## [1.1.0] — 2026-04-17

### 新增

- **ECPay AIO 金流整合**
  - `src/utils/ecpay.js`：CheckMacValue（CMV-SHA256）計算與驗證、`QueryTradeInfo` 主動查詢、AIO 表單參數建構
  - `POST /api/ecpay/checkout/:orderId`：產生 AIO 付款表單參數（含 CheckMacValue），回傳給前端動態提交
  - `POST /api/ecpay/query/:orderId`：主動呼叫綠界 QueryTradeInfo API 查詢付款結果，自動更新訂單狀態
  - `POST /ecpay/order-result`（OrderResultURL）：接收用戶瀏覽器 POST 的付款結果，驗證後更新訂單狀態並 redirect
  - `POST /ecpay/return`（ReturnURL）：Server-to-Server 付款通知，本地環境不可達，正式部署後生效

### 變更

- **訂單付款 UI 重構**（`order-detail.ejs` / `order-detail.js`）
  - 移除「付款成功」/「付款失敗」模擬按鈕
  - 新增「前往綠界付款」按鈕（跳轉至 ECPay 付款頁）
  - 新增「查詢付款狀態」按鈕（呼叫 QueryTradeInfo 確認結果）
  - `pending` 訂單兩個按鈕均可用；非 pending 訂單只顯示「再次確認付款狀態」

### 資料庫

- `orders` 表新增 `merchant_trade_no TEXT` 欄位（儲存綠界交易編號），以 `ALTER TABLE` migration 方式加入，向下相容

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

- 商品搜尋與分類篩選
- 訂單 Email 通知
- 用戶訂單取消（pending 狀態）
- 管理員庫存預警
- Rate limiting 防護
