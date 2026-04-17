# DEVELOPMENT.md — 開發規範

## 模組系統

本專案使用 **CommonJS**（`require` / `module.exports`），非 ES Modules。

```javascript
// 正確
const express = require('express');
const db = require('../database');
module.exports = router;

// 錯誤（不使用 ESM）
import express from 'express';
export default router;
```

---

## 命名規則對照表

| 類別 | 規則 | 範例 |
|------|------|------|
| 路由檔案 | camelCase + Routes 後綴 | `cartRoutes.js`, `adminProductRoutes.js` |
| Middleware 檔案 | camelCase + Middleware 後綴 | `authMiddleware.js`, `sessionMiddleware.js` |
| 頁面 JS 檔案 | kebab-case | `product-detail.js`, `admin-orders.js` |
| EJS 模板 | kebab-case | `product-detail.ejs`, `admin-sidebar.ejs` |
| 資料庫表名 | snake_case 複數 | `cart_items`, `order_items` |
| 資料庫欄位 | snake_case | `user_id`, `created_at`, `product_name` |
| API 路徑 | kebab-case | `/api/admin/products`, `/api/auth/login` |
| 錯誤碼 | SCREAMING_SNAKE_CASE | `CART_EMPTY`, `STOCK_INSUFFICIENT`, `NOT_FOUND` |
| 環境變數 | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `ADMIN_EMAIL` |
| localStorage key | snake_case 含前綴 | `flower_token`, `flower_user`, `flower_session_id` |

---

## 環境變數完整說明

| 變數 | 用途 | 必要 | 預設值 |
|------|------|------|--------|
| `JWT_SECRET` | JWT 簽名密鑰，任意字串但越隨機越安全 | **是** | — |
| `PORT` | Express 監聽埠號 | 否 | 3001 |
| `BASE_URL` | 後端基礎 URL（ECPay 回調用）| 否 | http://localhost:3001 |
| `FRONTEND_URL` | 前端 URL（CORS allow origin）| 否 | http://localhost:5173 |
| `ADMIN_EMAIL` | 種子管理員帳號（首次啟動時建立）| 否 | admin@hexschool.com |
| `ADMIN_PASSWORD` | 種子管理員密碼 | 否 | 12345678 |
| `NODE_ENV` | 執行環境；`test` 時 bcrypt saltRounds=1 加速測試 | 否 | development |
| `ECPAY_MERCHANT_ID` | 綠界金流特店編號 | 否（功能未實作）| 3002607 |
| `ECPAY_HASH_KEY` | 綠界 HashKey | 否 | — |
| `ECPAY_HASH_IV` | 綠界 HashIV | 否 | — |
| `ECPAY_ENV` | `staging` 或 `production` | 否 | staging |

> **重要：** `NODE_ENV=test` 時 bcrypt 使用 saltRounds=1，以加速測試執行。正式環境使用 saltRounds=10。

---

## 新增 API 端點步驟

1. **確定路由歸屬**
   - 一般用戶功能 → 在對應的 `src/routes/*.js` 中新增
   - 管理員功能 → `src/routes/adminProductRoutes.js` 或 `adminOrderRoutes.js`
   - 若需要新的路由檔案 → 在 `app.js` 中以 `app.use()` 掛載

2. **撰寫路由處理器**
   ```javascript
   // src/routes/exampleRoutes.js
   const express = require('express');
   const router = express.Router();
   const db = require('../database');
   const authMiddleware = require('../middleware/authMiddleware');

   /**
    * @openapi
    * /api/example:
    *   get:
    *     summary: 範例端點
    *     tags: [Example]
    */
   router.get('/', authMiddleware, (req, res) => {
     const result = db.prepare('SELECT * FROM ...').all();
     res.json({ data: result, error: null, message: '查詢成功' });
   });

   module.exports = router;
   ```

3. **回應格式必須統一**
   ```javascript
   // 成功
   res.status(200).json({ data: result, error: null, message: '操作成功' });
   // 建立
   res.status(201).json({ data: newItem, error: null, message: '建立成功' });
   // 錯誤（使用 next(err) 傳給 errorHandler）
   const err = new Error('資源不存在');
   err.statusCode = 404;
   err.errorCode = 'NOT_FOUND';
   err.isOperational = true;
   next(err);
   ```

4. **在 `app.js` 掛載路由（若新建路由檔案）**
   ```javascript
   const exampleRoutes = require('./src/routes/exampleRoutes');
   app.use('/api/example', exampleRoutes);
   ```

5. **撰寫對應測試**（見 [TESTING.md](./TESTING.md)）

---

## 新增 Middleware 步驟

1. 在 `src/middleware/` 新增 `xxxMiddleware.js`
2. 遵循 Express middleware 簽名：`(req, res, next) => {}`
3. 若驗證失敗，建立帶有 `statusCode` / `errorCode` / `isOperational` 的 Error 後呼叫 `next(err)`
4. 成功則呼叫 `next()`

```javascript
// src/middleware/exampleMiddleware.js
module.exports = (req, res, next) => {
  if (!req.headers['x-custom-header']) {
    const err = new Error('缺少必要 header');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    err.isOperational = true;
    return next(err);
  }
  req.customData = req.headers['x-custom-header'];
  next();
};
```

---

## 新增資料庫表步驟

1. 在 `src/database.js` 的初始化區段加入 `CREATE TABLE IF NOT EXISTS` SQL
2. 啟用必要的 PRAGMA（已全域啟用 foreign_keys 與 WAL）
3. 若需種子資料，在 `database.js` 底部加入 `INSERT OR IGNORE`
4. 在相關路由中使用 `db.prepare()` 建立 prepared statement

```javascript
// src/database.js 中新增
db.exec(`
  CREATE TABLE IF NOT EXISTS new_table (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
```

---

## JSDoc 格式說明

本專案使用 `swagger-jsdoc` 從路由檔案的 JSDoc 註解產生 OpenAPI 文件。執行 `npm run openapi` 輸出 `openapi.json`。

**JSDoc 格式範例：**
```javascript
/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: 取得商品列表
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每頁數量
 *     responses:
 *       200:
 *         description: 成功取得商品列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 */
router.get('/', (req, res) => { ... });
```

---

## 計畫歸檔流程

### 開發新功能前

1. 在 `docs/plans/` 建立計畫檔案，命名格式：`YYYY-MM-DD-<feature-name>.md`
2. 計畫文件結構：

```markdown
# YYYY-MM-DD — <功能名稱>

## User Story
身為 <角色>，我希望 <功能>，以便 <目的>。

## Spec
- 端點：METHOD /api/...
- 請求 body / query 欄位說明
- 回應格式
- 業務規則與限制

## Tasks
- [ ] 建立路由處理器
- [ ] 新增 middleware（若需要）
- [ ] 資料庫 schema 變更（若需要）
- [ ] 撰寫測試
- [ ] 更新 FEATURES.md
- [ ] 更新 CHANGELOG.md
```

### 功能完成後

3. 移動計畫檔案至 `docs/plans/archive/`
4. 更新 `docs/FEATURES.md`（將功能標記為完成，補充行為描述）
5. 更新 `docs/CHANGELOG.md`（記錄版本變更）

---

## 程式碼慣例

### 資料庫查詢

使用 `db.prepare()` 的 prepared statements，避免字串拼接（SQL injection 防護）：

```javascript
// 正確
const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
const product = stmt.get(productId);

// 錯誤（不使用字串拼接）
const product = db.exec(`SELECT * FROM products WHERE id = '${productId}'`);
```

### 錯誤處理

**不要在路由中直接 `res.status(500)`**，應使用 `next(err)` 傳遞給 `errorHandler`：

```javascript
try {
  // ... 業務邏輯
} catch (err) {
  next(err); // 由 errorHandler 統一處理
}
```

### 訂單類交易操作

涉及多張表同時寫入的操作必須使用 `db.transaction()`：

```javascript
const createOrder = db.transaction((data) => {
  db.prepare('INSERT INTO orders ...').run(data.order);
  db.prepare('INSERT INTO order_items ...').run(data.items);
  db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(...);
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(data.userId);
});
createOrder({ order, items, userId });
```
