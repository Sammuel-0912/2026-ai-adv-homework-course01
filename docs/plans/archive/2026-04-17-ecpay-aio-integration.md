# 2026-04-17 — ECPay AIO 金流整合

## User Story

身為購買者，我希望能透過綠界金流完成真實付款，以便取代原本的模擬付款按鈕，讓訂單付款具備實際意義。

## Spec

- 端點：POST /api/ecpay/checkout/:orderId（需 JWT）
- 端點：POST /api/ecpay/query/:orderId（需 JWT）
- 端點：POST /ecpay/return（ReturnURL，CheckMacValue 驗證，正式環境 S2S）
- 端點：POST /ecpay/order-result（OrderResultURL，CheckMacValue 驗證，瀏覽器 POST）
- checkout 回傳 `{ data: { action, method, params } }`，前端動態建立 form 並 submit 至綠界
- order-result 處理後 302 redirect 至 `/orders/:id?payment=success` 或 `?payment=failed`
- return 必須回傳純文字 `1|OK`（HTTP 200），驗證失敗仍須回傳以避免重試
- 只有 status = 'pending' 的訂單可發起付款；否則 400 INVALID_STATUS
- 每次呼叫 checkout 產生新的 MerchantTradeNo（UUID 去連字號取前 20 碼），寫入 orders.merchant_trade_no
- MerchantTradeDate 使用 UTC+8，格式 `yyyy/MM/dd HH:mm:ss`
- ItemName 超過 200 字元自動截斷，避免 UTF-8 截斷導致 CheckMacValue 不符
- CheckMacValue 採 CMV-SHA256，驗證使用 `crypto.timingSafeEqual()` 防時序攻擊
- 本地環境限制：ReturnURL（S2S）無法接收；改以 OrderResultURL（瀏覽器跳轉）為主要確認機制，並提供 QueryTradeInfo 主動查詢按鈕作為備用
- 資料庫：orders 表新增 `merchant_trade_no TEXT` 欄位，以 ALTER TABLE migration 加入（idempotent）

## Tasks

- [O] 建立 `src/utils/ecpay.js`（CheckMacValue、表單參數、QueryTradeInfo）
- [O] 建立 `src/routes/ecpayRoutes.js`（四個端點）
- [O] `src/database.js` 加入 migration
- [O] `app.js` 掛載 ecpayRoutes
- [O] 更新 `views/pages/order-detail.ejs`（換成綠界付款按鈕）
- [O] 更新 `public/js/pages/order-detail.js`（動態建立 form 提交）
- [O] 更新 `docs/FEATURES.md`
- [O] 更新 `docs/CHANGELOG.md`
- [O] 更新 `docs/ARCHITECTURE.md`
