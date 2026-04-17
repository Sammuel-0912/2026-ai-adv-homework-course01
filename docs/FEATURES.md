# FEATURES.md — 功能清單

## 完成狀態總覽

| 功能區塊 | 狀態 |
|----------|------|
| 用戶認證（註冊/登入）| ✅ 完成 |
| 商品瀏覽（列表/詳情）| ✅ 完成 |
| 購物車（訪客/會員雙模式）| ✅ 完成 |
| 訂單建立（庫存扣除、Transaction）| ✅ 完成 |
| 訂單查詢（用戶個人）| ✅ 完成 |
| 模擬付款（pending → paid/failed）| ✅ 完成 |
| 管理員商品 CRUD | ✅ 完成 |
| 管理員訂單查詢 | ✅ 完成 |
| ECPay 金流整合（AIO + QueryTradeInfo）| ✅ 完成 |
| 商品搜尋/篩選 | ❌ 未實作 |
| Email 通知 | ❌ 未實作 |
| 訂單取消 | ❌ 未實作 |

---

## 用戶認證

### 行為描述

**POST /api/auth/register**
- 必填欄位：`email`（唯一）、`password`（最短 6 碼）、`name`
- 密碼以 bcrypt 加密後存入 `password_hash`
- 回傳 JWT token（有效期 7 天）與用戶資料（不含密碼）
- 若 email 已被使用 → 409 `CONFLICT`

**POST /api/auth/login**
- 必填欄位：`email`、`password`
- 以 bcrypt.compare 驗證密碼
- 回傳 JWT token（有效期 7 天）與用戶資料
- Email 不存在或密碼錯誤 → 401 `UNAUTHORIZED`（不區分哪個錯，避免枚舉）

**GET /api/auth/profile**
- 需要 `Authorization: Bearer <token>`
- 回傳目前登入用戶的 id、email、name、role、created_at
- token 無效/過期 → 401 `UNAUTHORIZED`

---

## 商品瀏覽

### 行為描述

**GET /api/products**
- 查詢參數：`page`（預設 1）、`limit`（預設 10）
- 回傳商品陣列與分頁資訊：`{ items, total, page, limit, totalPages }`
- 不需要認證，公開存取
- 商品依 `created_at` 倒序排列（最新優先）

**GET /api/products/:id**
- 路徑參數：`id`（商品 UUID）
- 回傳單一商品的完整資料（含 description、stock）
- 商品不存在 → 404 `NOT_FOUND`

---

## 購物車

### 行為描述（雙模式認證）

購物車支援**兩種認證模式**，在同一組端點上運作：
- **JWT 模式**（已登入用戶）：使用 `Authorization: Bearer <token>`，以 `user_id` 識別購物車
- **Session 模式**（訪客）：使用 `X-Session-Id: <uuid>` header，以 `session_id` 識別購物車

兩種模式的購物車資料完全獨立。若用戶登入後，其訪客購物車**不會**自動合併（目前限制）。

**GET /api/cart**
- 回傳該用戶/Session 的所有購物車項目，包含商品詳情（name、price、image_url）
- 購物車為空時回傳空陣列，不報錯

**POST /api/cart**
- 必填欄位：`productId`、`quantity`（正整數）
- 若該商品已在購物車中 → **累加**數量（不是取代）
- 若商品不存在 → 404 `NOT_FOUND`
- 回傳更新後的購物車項目

**PATCH /api/cart/:itemId**
- 必填欄位：`quantity`（正整數）
- 只能修改屬於自己的購物車項目（以 user_id 或 session_id 驗證歸屬）
- 嘗試修改他人購物車 → 404 `NOT_FOUND`（不洩漏存在性）

**DELETE /api/cart/:itemId**
- 刪除指定購物車項目
- 歸屬驗證同 PATCH

---

## 訂單建立

### 行為描述

**POST /api/orders**

需要 JWT 認證。請求 body 必填欄位：
- `recipient_name`：收件人姓名
- `recipient_email`：收件人 Email
- `recipient_address`：收件地址

業務邏輯（全部在一個 Transaction 中完成）：
1. 取得該用戶購物車（JOIN products 取得商品資訊）
2. 若購物車為空 → 400 `CART_EMPTY`
3. 逐一檢查每個商品的 `stock >= quantity`，若不足 → 400 `STOCK_INSUFFICIENT`（訊息指出哪個商品）
4. 計算 `total_amount = Σ(price × quantity)`
5. 產生 `order_no`：`ORD-YYYYMMDD-XXXXX`（XXXXX 為隨機 5 碼英數字）
6. INSERT INTO orders
7. INSERT INTO order_items（**快照**當下的 product_name 與 product_price）
8. UPDATE products SET stock = stock - quantity
9. DELETE FROM cart_items WHERE user_id = ?

回傳新訂單資料，status = `'pending'`。

---

## 訂單查詢

**GET /api/orders**
- 回傳目前登入用戶的所有訂單（依 created_at 倒序）
- 每筆訂單包含：id、order_no、total_amount、status、created_at

**GET /api/orders/:id**
- 回傳訂單詳情，含 `order_items` 陣列
- 每個 order_item 包含：product_name（快照）、product_price（快照）、quantity、小計
- 只能查詢自己的訂單；查詢他人訂單 → 404 `NOT_FOUND`

---

## 模擬付款

### 行為描述

**PATCH /api/orders/:id/pay**

模擬付款端點，可在不使用綠界金流的情況下直接變更訂單狀態（測試用途）：
- 必填欄位：`action`（`"success"` 或 `"fail"`）
- 只有 `status = 'pending'` 的訂單可執行
- `action: "success"` → status 更新為 `'paid'`
- `action: "fail"` → status 更新為 `'failed'`
- 狀態已非 pending（重複付款）→ 400 `VALIDATION_ERROR`
- 只能操作自己的訂單

> **注意：** 此端點為輔助測試工具，正式付款流程請使用 ECPay AIO 金流（見下方章節）。

---

## ECPay 金流整合

### 架構說明

本專案採用綠界 **全方位金流 AIO（CMV-SHA256 協議）**。由於專案運行於本地端，ECPay 伺服器無法主動呼叫 `ReturnURL`（Server-to-Server callback），因此付款確認採用以下機制：

1. **`OrderResultURL`（主要）**：付款完成後，ECPay 透過用戶瀏覽器 POST 結果至本機 `/ecpay/order-result`，本地環境可正常接收並即時更新訂單狀態。
2. **`QueryTradeInfo` 主動查詢（備用）**：前端提供「查詢付款狀態」按鈕，可隨時呼叫 ECPay API 確認付款結果。

### 付款流程

```
用戶點擊「前往綠界付款」
→ POST /api/ecpay/checkout/:orderId（附 JWT）
→ 後端計算 CheckMacValue，回傳 AIO 表單參數
→ 前端動態建立 form 並 submit 至 ECPay
→ 用戶在綠界付款頁完成付款（信用卡 / ATM / 超商等）
→ ECPay 由用戶瀏覽器 POST 結果至 /ecpay/order-result（OrderResultURL）
→ 後端驗證 CheckMacValue，更新訂單狀態
→ 302 redirect 至 /orders/:id?payment=success 或 ?payment=failed
```

### API 端點行為描述

**POST /api/ecpay/checkout/:orderId**（需 JWT）

啟動付款，產生 AIO 表單參數回傳給前端：
- 訂單必須屬於目前登入用戶
- 訂單 `status` 必須為 `'pending'`；否則 → 400 `INVALID_STATUS`
- 每次呼叫都會產生新的 `MerchantTradeNo`（英數字 20 碼，來自 UUID 去除連字號），並更新至 `orders.merchant_trade_no`
- `ItemName` 超過 200 字元時自動截斷，避免 CheckMacValue 因 UTF-8 截斷錯誤
- 回傳：`{ action, method, params }` — 前端動態建立 form 提交即可
- 若訂單不存在 → 404 `NOT_FOUND`

**POST /api/ecpay/query/:orderId**（需 JWT）

主動向綠界查詢付款狀態：
- 呼叫 `/Cashier/QueryTradeInfo/V5` API
- `TradeStatus === '1'` 表示付款成功，自動將訂單 status 更新為 `'paid'`
- 若訂單尚未呼叫過 checkout（無 `merchant_trade_no`）→ 400 `NOT_INITIATED`
- 回傳查詢結果：`{ order, ecpay: { tradeStatus, paymentType, tradeAmt, tradeDate } }`

**POST /ecpay/return**（ReturnURL — Server-to-Server）

綠界伺服器主動呼叫的付款通知端點，本地環境無法接收，正式部署後生效：
- 驗證 CheckMacValue（失敗時仍回傳 `1|OK` 避免綠界重試）
- `RtnCode === '1'` 時更新訂單 status 為 `'paid'`
- 必須以純文字 `1|OK` 回應（HTTP 200），不可回傳 JSON 或帶引號

**POST /ecpay/order-result**（OrderResultURL — 瀏覽器跳轉）

付款後由用戶瀏覽器 POST 結果，本地環境可正常接收：
- 驗證 CheckMacValue
- 透過 `CustomField1`（儲存 `order.id`）找回對應訂單
- `RtnCode === '1'` → status 更新為 `'paid'`；否則更新為 `'failed'`
- 完成後 redirect 至 `/orders/:id?payment=success` 或 `?payment=failed`

### CheckMacValue 計算規則

AIO 使用 **CMV-SHA256** 協議，實作於 `src/utils/ecpay.js`：

1. 移除 `CheckMacValue` 自身
2. 所有 key 按不分大小寫排序
3. 拼接字串：`HashKey=xxx&k1=v1&...&HashIV=xxx`
4. 套用 `ecpayUrlEncode()`（encodeURIComponent → 替換 → toLowerCase → .NET 字元還原）
5. SHA256 雜湊後轉大寫
6. 驗證時使用 `crypto.timingSafeEqual()` 防時序攻擊

> **重要：** `ecpayUrlEncode` 與站內付 2.0 的 `aesUrlEncode` 邏輯不同，不可混用。

### 環境變數

| 變數 | 說明 | 測試值 |
|------|------|--------|
| `ECPAY_MERCHANT_ID` | 綠界特店編號 | `3002607` |
| `ECPAY_HASH_KEY` | 簽章金鑰 | `pwFHCqoQZGmho4w6` |
| `ECPAY_HASH_IV` | 簽章 IV | `EkRm7iFT261dpevs` |
| `ECPAY_ENV` | `staging`（測試）或 `production`（正式）| `staging` |
| `BASE_URL` | ReturnURL / OrderResultURL 前綴 | `http://localhost:3001` |

---

## 管理員商品管理

### 行為描述

所有端點需要 JWT + `role = 'admin'`。

**GET /api/admin/products**
- 查詢參數：`page`（預設 1）、`limit`（預設 10）
- 回傳分頁商品列表，含 stock 與 created_at

**POST /api/admin/products**
- 必填：`name`、`price`（正整數）
- 選填：`description`、`stock`（預設 0）、`image_url`
- id 自動以 `uuidv4()` 產生
- 回傳新建立的商品

**PUT /api/admin/products/:id**
- 可更新欄位：`name`、`description`、`price`、`stock`、`image_url`
- 同時更新 `updated_at = datetime('now')`
- 商品不存在 → 404 `NOT_FOUND`

**DELETE /api/admin/products/:id**
- 若該商品存在於任何 `status = 'pending'` 的訂單中 → 409 `CONFLICT`（防止刪除進行中的訂單商品）
- 商品不存在 → 404 `NOT_FOUND`
- 刪除成功回傳 204 或確認訊息

---

## 管理員訂單管理

### 行為描述

**GET /api/admin/orders**
- 查詢參數：`status`（選填，`'pending'` / `'paid'` / `'failed'`）
- 無 status 參數 → 回傳所有訂單
- 有 status 參數 → 篩選該狀態的訂單
- 依 created_at 倒序排列，含用戶名稱（JOIN users）

**GET /api/admin/orders/:id**
- 回傳完整訂單詳情
- 含下單用戶資訊（name、email）
- 含所有 order_items（商品名稱快照、單價、數量）

---

## 種子資料

初次啟動時自動植入：

**管理員帳號：**
- Email: admin@hexschool.com（可透過 ADMIN_EMAIL 環境變數覆蓋）
- Password: 12345678（可透過 ADMIN_PASSWORD 環境變數覆蓋）
- Role: admin

**預設商品（8 種花卉）：**

| 商品名稱 | 售價（TWD）| 庫存 |
|----------|-----------|------|
| 粉色玫瑰花束 | 1,680 | 30 |
| 白色百合花禮盒 | 1,280 | 25 |
| 繽紛向日葵花束 | 980 | 40 |
| 紫色鬱金香盆栽 | 750 | 50 |
| 乾燥花藝術花圈 | 1,450 | 20 |
| 迷你多肉組合盆 | 580 | 60 |
| 經典紅玫瑰花束（99 朵）| 3,980 | 15 |
| 季節鮮花訂閱 | 890 | 100 |
