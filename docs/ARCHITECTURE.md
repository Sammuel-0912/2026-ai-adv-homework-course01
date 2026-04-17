# ARCHITECTURE.md — 系統架構

## 目錄結構

```
project-root/
├── app.js                      # Express app 初始化、middleware 掛載、路由註冊
├── server.js                   # 進入點：監聽 PORT，啟動 HTTP server
├── package.json                # 套件版本與 npm scripts
├── vitest.config.js            # Vitest 測試設定（循序執行、hook timeout）
├── swagger-config.js           # OpenAPI 3.0.3 規格設定
├── generate-openapi.js         # 讀取 JSDoc 產生 openapi.json
├── .env                        # 環境變數（含 ECPay 金流設定）
├── .env.example                # 環境變數範本
├── database.sqlite             # SQLite 資料庫檔案（啟動時自動建立）
│
├── src/
│   ├── database.js             # DB 初始化：建表、migration、WAL 模式、植入種子資料
│   ├── middleware/
│   │   ├── authMiddleware.js   # 解析 Authorization Bearer JWT，注入 req.user
│   │   ├── adminMiddleware.js  # 檢查 req.user.role === 'admin'
│   │   ├── sessionMiddleware.js# 提取 X-Session-Id header，注入 req.sessionId
│   │   └── errorHandler.js     # 全域錯誤捕捉，回傳標準 JSON 錯誤格式
│   ├── routes/
│   │   ├── authRoutes.js       # POST /register /login；GET /profile
│   │   ├── pageRoutes.js       # EJS 頁面路由（SSR）
│   │   ├── productRoutes.js    # GET /api/products、/api/products/:id
│   │   ├── cartRoutes.js       # 購物車 CRUD（雙模式：JWT 或 Session）
│   │   ├── orderRoutes.js      # 訂單建立、查詢、模擬付款
│   │   ├── ecpayRoutes.js      # ECPay AIO 付款啟動、OrderResultURL、ReturnURL、QueryTradeInfo
│   │   ├── adminProductRoutes.js # 管理員商品 CRUD
│   │   └── adminOrderRoutes.js # 管理員訂單查詢
│   └── utils/
│       └── ecpay.js            # CheckMacValue（CMV-SHA256）、表單參數建構、QueryTradeInfo 呼叫
│
├── public/
│   ├── css/
│   │   ├── input.css           # Tailwind CSS 來源（含指令）
│   │   └── output.css          # 編譯後的壓縮 CSS（.gitignore 排除）
│   ├── stylesheets/
│   │   └── style.css           # 補充樣式
│   └── js/
│       ├── api.js              # apiFetch() 封裝：自動加 Auth + Session header，處理 401
│       ├── auth.js             # 客戶端認證：localStorage 存取 JWT/user/session_id
│       ├── notification.js     # Toast 通知 UI 元件
│       ├── header-init.js      # 頁面 header 初始化（登入狀態、購物車數量）
│       └── pages/              # 各頁面獨立 Vue.js 3 應用程式
│           ├── index.js        # 首頁商品列表
│           ├── login.js        # 登入 / 註冊
│           ├── product-detail.js # 商品詳情
│           ├── cart.js         # 購物車
│           ├── checkout.js     # 結帳表單
│           ├── orders.js       # 訂單歷史列表
│           ├── order-detail.js # 訂單詳情 + ECPay 付款啟動 + 狀態查詢
│           ├── admin-products.js # 管理員商品管理
│           └── admin-orders.js # 管理員訂單查詢
│
├── views/
│   ├── layouts/
│   │   ├── front.ejs           # 一般頁面版型（含 header/footer）
│   │   └── admin.ejs           # 管理後台版型（含 sidebar）
│   ├── pages/
│   │   ├── index.ejs           # 首頁
│   │   ├── product-detail.ejs  # 商品詳情頁
│   │   ├── cart.ejs            # 購物車頁
│   │   ├── checkout.ejs        # 結帳頁
│   │   ├── login.ejs           # 登入/註冊頁
│   │   ├── orders.ejs          # 訂單歷史頁
│   │   ├── order-detail.ejs    # 訂單詳情頁
│   │   ├── 404.ejs             # 404 頁面
│   │   └── admin/
│   │       ├── products.ejs    # 管理員商品管理頁
│   │       └── orders.ejs      # 管理員訂單管理頁
│   └── partials/
│       ├── head.ejs            # <head> meta + CSS 引入
│       ├── header.ejs          # 前台導覽列
│       ├── admin-header.ejs    # 後台頂部 header
│       ├── admin-sidebar.ejs   # 後台側欄導覽
│       ├── footer.ejs          # 頁尾
│       └── notification.ejs    # Toast 通知容器（Vue 掛載點）
│
└── tests/
    ├── setup.js                # 測試輔助：getAdminToken()、registerUser()
    ├── auth.test.js            # 認證流程測試
    ├── products.test.js        # 商品 API 測試
    ├── cart.test.js            # 購物車操作測試
    ├── orders.test.js          # 訂單流程測試
    ├── adminProducts.test.js   # 管理員商品 CRUD 測試
    └── adminOrders.test.js     # 管理員訂單查詢測試
```

---

## 啟動流程

```
npm start
  └─ npm run css:build          # 編譯 Tailwind CSS → public/css/output.css
  └─ node server.js
       └─ require('./app')       # Express app 初始化
       │    ├─ 載入 middleware（cors, json, urlencoded, sessionMiddleware）
       │    ├─ 註冊路由（page, auth, products, cart, orders, admin）
       │    └─ 掛載 404 handler + errorHandler
       └─ require('./src/database')  # DB 初始化
            ├─ 開啟 database.sqlite
            ├─ 啟用 PRAGMA foreign_keys = ON
            ├─ 啟用 PRAGMA journal_mode = WAL
            ├─ CREATE TABLE IF NOT EXISTS（users, products, cart_items, orders, order_items）
            ├─ ALTER TABLE orders ADD COLUMN merchant_trade_no（migration，已存在則跳過）
            └─ 植入種子資料（1 位管理員 + 8 種花卉商品，若已存在則跳過）
```

---

## API 路由總覽

| 前綴 | 路由檔案 | 需要認證 | 說明 |
|------|----------|----------|------|
| `/` | pageRoutes.js | 否 | EJS 頁面（SSR）|
| `/api/auth` | authRoutes.js | 部分（/profile 需要）| 註冊、登入、個人資料 |
| `/api/products` | productRoutes.js | 否 | 商品列表與詳情 |
| `/api/cart` | cartRoutes.js | 需 JWT 或 X-Session-Id | 購物車 CRUD |
| `/api/orders` | orderRoutes.js | 需 JWT | 訂單管理 |
| `/api/ecpay` | ecpayRoutes.js | 部分（checkout/query 需 JWT）| ECPay 金流整合 |
| `/ecpay` | ecpayRoutes.js | 否（綠界 callback / 瀏覽器跳轉）| ECPay OrderResultURL / ReturnURL |
| `/api/admin/products` | adminProductRoutes.js | 需 JWT + admin 角色 | 管理員商品 CRUD |
| `/api/admin/orders` | adminOrderRoutes.js | 需 JWT + admin 角色 | 管理員訂單查詢 |

### 詳細端點

#### 認證 `/api/auth`
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/register` | 否 | 註冊新用戶，回傳 token + user |
| POST | `/login` | 否 | 帳密登入，回傳 token + user |
| GET | `/profile` | JWT | 取得目前登入用戶資料 |

#### 商品 `/api/products`
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | 否 | 商品列表（分頁：?page=1&limit=10）|
| GET | `/:id` | 否 | 單一商品詳情 |

#### 購物車 `/api/cart`
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | JWT 或 Session | 取得購物車項目 |
| POST | `/` | JWT 或 Session | 加入商品（已存在則累加數量）|
| PATCH | `/:itemId` | JWT 或 Session | 更新商品數量 |
| DELETE | `/:itemId` | JWT 或 Session | 移除購物車項目 |

#### 訂單 `/api/orders`
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/` | JWT | 從購物車建立訂單（含庫存扣除、交易）|
| GET | `/` | JWT | 取得目前用戶訂單列表 |
| GET | `/:id` | JWT | 取得訂單詳情（含商品明細）|
| PATCH | `/:id/pay` | JWT | 模擬付款（action: "success" 或 "fail"，測試用）|

#### ECPay 金流 `/api/ecpay` 與 `/ecpay`
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/api/ecpay/checkout/:orderId` | JWT | 產生 AIO 付款表單參數（含 CheckMacValue）|
| POST | `/api/ecpay/query/:orderId` | JWT | 主動查詢綠界付款狀態並更新訂單 |
| POST | `/ecpay/return` | 否（CheckMacValue 驗證）| ReturnURL — 綠界 S2S 通知（正式環境）|
| POST | `/ecpay/order-result` | 否（CheckMacValue 驗證）| OrderResultURL — 瀏覽器跳轉，更新狀態後 redirect |

#### 管理員商品 `/api/admin/products`
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | JWT + admin | 分頁商品列表 |
| POST | `/` | JWT + admin | 新增商品 |
| PUT | `/:id` | JWT + admin | 更新商品資料 |
| DELETE | `/:id` | JWT + admin | 刪除商品（有待付款訂單時拒絕）|

#### 管理員訂單 `/api/admin/orders`
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | JWT + admin | 所有訂單（?status= 篩選）|
| GET | `/:id` | JWT + admin | 訂單詳情（含用戶資訊）|

---

## 統一回應格式

**成功回應：**
```json
{
  "data": { "token": "...", "user": { "id": "...", "email": "...", "name": "...", "role": "user" } },
  "error": null,
  "message": "登入成功"
}
```

**錯誤回應：**
```json
{
  "data": null,
  "error": "UNAUTHORIZED",
  "message": "請先登入"
}
```

**HTTP 狀態碼對照：**
| 狀態碼 | 錯誤碼 | 情境 |
|--------|--------|------|
| 200 | — | 成功 |
| 201 | — | 建立成功 |
| 400 | `VALIDATION_ERROR` | 欄位驗證失敗 |
| 400 | `CART_EMPTY` | 購物車為空，無法結帳 |
| 400 | `STOCK_INSUFFICIENT` | 庫存不足 |
| 401 | `UNAUTHORIZED` | 未提供或無效 token |
| 403 | `FORBIDDEN` | 權限不足（非 admin）|
| 404 | `NOT_FOUND` | 資源不存在 |
| 409 | `CONFLICT` | Email 重複 / 商品有待付款訂單 |
| 500 | `INTERNAL_ERROR` | 伺服器錯誤（不洩漏細節）|

---

## 認證與授權機制

### JWT 認證（authMiddleware.js）

- **演算法：** HS256
- **有效期：** 7 天
- **Payload：** `{ userId, email, role }`
- **Header 格式：** `Authorization: Bearer <token>`
- **行為：** 驗證成功後將 decoded payload 注入 `req.user`；token 無效或過期回傳 401

### 購物車雙模式認證（cartRoutes.js 內的 dualAuth）

購物車路由使用自訂的 `dualAuth` middleware，不同於其他路由：
1. 優先嘗試解析 `Authorization: Bearer <token>`（JWT 模式）
2. 若無 JWT，嘗試取得 `X-Session-Id` header（Session 模式）
3. 兩者皆無時回傳 `401 UNAUTHORIZED`
4. JWT 模式：查詢時以 `user_id` 識別購物車
5. Session 模式：查詢時以 `session_id` 識別購物車（訪客）

### 管理員授權（adminMiddleware.js）

- 檢查 `req.user.role === 'admin'`
- 需在 `authMiddleware` 之後執行（依賴 `req.user`）
- 權限不足回傳 `403 FORBIDDEN`

### Session Middleware（sessionMiddleware.js）

- 從 `X-Session-Id` header 提取 session ID
- 注入 `req.sessionId`（所有路由皆可存取）
- 客戶端在 localStorage 中以 `crypto.randomUUID()` 自動產生 session_id

---

## 資料庫 Schema

### users 表
| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| email | TEXT | UNIQUE NOT NULL | 電子信箱 |
| password_hash | TEXT | NOT NULL | bcrypt 雜湊密碼 |
| name | TEXT | NOT NULL | 顯示名稱 |
| role | TEXT | NOT NULL DEFAULT 'user' | 'user' 或 'admin' |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | 建立時間（ISO 8601）|

### products 表
| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | 商品名稱 |
| description | TEXT | — | 商品描述 |
| price | INTEGER | NOT NULL CHECK price > 0 | 售價（新台幣）|
| stock | INTEGER | NOT NULL DEFAULT 0 CHECK stock >= 0 | 庫存數量 |
| image_url | TEXT | — | 商品圖片 URL |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | 建立時間 |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | 最後更新時間 |

### cart_items 表
| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| session_id | TEXT | — | 訪客 Session ID（與 user_id 二擇一）|
| user_id | TEXT | FK → users(id) | 登入用戶 ID（與 session_id 二擇一）|
| product_id | TEXT | NOT NULL FK → products(id) | 商品 ID |
| quantity | INTEGER | NOT NULL DEFAULT 1 CHECK quantity > 0 | 數量 |

> **注意：** `session_id` 與 `user_id` 不同時存在，用來實現雙模式購物車。查詢條件需根據認證模式選擇正確欄位。

### orders 表
| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| order_no | TEXT | UNIQUE NOT NULL | 可讀訂單編號（ORD-YYYYMMDD-XXXXX）|
| user_id | TEXT | NOT NULL FK → users(id) | 下單用戶 |
| recipient_name | TEXT | NOT NULL | 收件人姓名 |
| recipient_email | TEXT | NOT NULL | 收件人 Email |
| recipient_address | TEXT | NOT NULL | 收件地址 |
| total_amount | INTEGER | NOT NULL | 訂單總金額（新台幣）|
| status | TEXT | NOT NULL DEFAULT 'pending' | 'pending' / 'paid' / 'failed' |
| merchant_trade_no | TEXT | — | 綠界交易編號（英數字 20 碼，每次發起付款更新）|
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | 訂單建立時間 |

> **注意：** `merchant_trade_no` 透過 `ALTER TABLE` migration 加入，每次呼叫 `/api/ecpay/checkout/:orderId` 時更新，用於 `QueryTradeInfo` 查詢與 `OrderResultURL` 回查訂單。

### order_items 表
| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| order_id | TEXT | NOT NULL FK → orders(id) | 所屬訂單 |
| product_id | TEXT | NOT NULL FK → products(id) | 商品 ID |
| product_name | TEXT | NOT NULL | **快照**：下單時的商品名稱 |
| product_price | INTEGER | NOT NULL | **快照**：下單時的商品單價 |
| quantity | INTEGER | NOT NULL | 購買數量 |

> **重要：** `order_items` 儲存下單當下的商品名稱與價格快照，即使商品後續修改或刪除，訂單歷史仍保持正確。

---

## 資料流

### 訂單建立流程（Transaction）

```
POST /api/orders
  ├─ authMiddleware（驗證 JWT）
  ├─ 取得 req.user.userId
  ├─ 驗證 recipient_name / recipient_email / recipient_address
  ├─ 查詢 cart_items（JOIN products）取得購物車商品
  ├─ 若購物車為空 → 400 CART_EMPTY
  ├─ 對每個商品檢查 stock >= quantity → 不足則 400 STOCK_INSUFFICIENT
  ├─ 計算 total_amount = Σ(price × quantity)
  └─ db.transaction() {
       ├─ INSERT INTO orders (id, order_no, user_id, ...)
       ├─ INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity)  ← 快照
       ├─ UPDATE products SET stock = stock - quantity WHERE id = ?  ← 扣庫存
       └─ DELETE FROM cart_items WHERE user_id = ?  ← 清空購物車
     }
  └─ 回傳新訂單資料（status: 'pending'）
```

### 客戶端認證流程

```
用戶登入
  └─ POST /api/auth/login
       └─ 回傳 token + user
            └─ 存入 localStorage（flower_token, flower_user）

頁面載入
  └─ auth.js: getToken() 從 localStorage 讀取 JWT
       └─ api.js: apiFetch() 自動加入 Authorization: Bearer <token>
            └─ 若回傳 401 → 清除 localStorage → redirect /login

訪客購物車
  └─ auth.js: getSessionId() 自動產生並存入 flower_session_id
       └─ apiFetch() 自動加入 X-Session-Id: <session_id>
```

---

## 前端架構

每個頁面皆有獨立的 Vue.js 3 應用程式（`public/js/pages/*.js`），透過 EJS 模板的 `<script>` 標籤載入。

**Vue app 結構模式：**
```javascript
const { createApp, ref, onMounted } = Vue;
createApp({
  setup() {
    const products = ref([]);
    onMounted(async () => {
      // 透過 apiFetch() 載入資料
    });
    return { products };
  }
}).mount('#app');
```

**管理員頁面保護：**
- 在 Vue app 掛載前呼叫 `Auth.requireAdmin()`
- 若未登入或非 admin → redirect `/login`
