# 2026-04-17 — ECPay AIO 金流整合

## User Story

身為購買者，我希望能透過綠界金流完成真實付款，以便取代原本的模擬付款按鈕，讓訂單結果具備實際意義。

## Spec

### 架構限制
本專案僅運行於本地端（localhost），ECPay 伺服器無法主動呼叫 ReturnURL（Server-to-Server callback）。付款確認改採：
1. **OrderResultURL**（主要）：付款後 ECPay 透過用戶瀏覽器 POST 結果至本機，localhost 可接收
2. **QueryTradeInfo 主動查詢**（備用）：前端提供按鈕，隨時呼叫 ECPay API 確認付款狀態

### 端點規格

| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/api/ecpay/checkout/:orderId` | JWT | 產生 AIO 表單參數，回傳給前端 |
| POST | `/api/ecpay/query/:orderId` | JWT | 主動查詢 QueryTradeInfo，更新訂單狀態 |
| POST | `/ecpay/return` | CheckMacValue | ReturnURL（正式環境 S2S，本地不可達）|
| POST | `/ecpay/order-result` | CheckMacValue | OrderResultURL（瀏覽器 POST，本地可接收）|

### 請求 / 回應格式

**POST /api/ecpay/checkout/:orderId**
- 回應：`{ data: { action, method, params }, error, message }`
- `params` 包含完整 AIO 欄位與 CheckMacValue，前端動態建立 form 提交

**POST /ecpay/order-result**
- 接收：綠界 Form POST（application/x-www-form-urlencoded）
- 處理後 302 redirect 至 `/orders/:id?payment=success` 或 `?payment=failed`

**POST /ecpay/return**
- 回應：純文字 `1|OK`（HTTP 200），不可為 JSON 或含引號

### 業務規則
- 只有 `status = 'pending'` 的訂單可發起付款
- 每次呼叫 checkout 產生新的 `MerchantTradeNo`（UUID 去除連字號取前 20 碼）
- `MerchantTradeDate` 必須使用 UTC+8 時區，格式 `yyyy/MM/dd HH:mm:ss`
- `ItemName` 超過 200 字元時自動截斷，避免 UTF-8 截斷導致 CheckMacValue 不符
- CheckMacValue 驗證使用 `crypto.timingSafeEqual()` 防時序攻擊
- `ReturnURL` 驗證失敗仍須回傳 `1|OK`，避免綠界觸發重試

### 資料庫變更
- `orders` 表新增 `merchant_trade_no TEXT` 欄位（`ALTER TABLE` migration，idempotent）

## Tasks

- [x] 建立 `src/utils/ecpay.js`（CheckMacValue、表單參數、QueryTradeInfo）
- [x] 建立 `src/routes/ecpayRoutes.js`（四個端點）
- [x] `src/database.js` 加入 migration
- [x] `app.js` 掛載 ecpayRoutes
- [x] 更新 `views/pages/order-detail.ejs`（換成綠界付款按鈕）
- [x] 更新 `public/js/pages/or
der-detail.js`（動態建立 form 提交）
- [x] 更新 `docs/FEATURES.md`
- [x] 更新 `docs/CHANGELOG.md`
- [x] 更新 `docs/ARCHITECTURE.md`
