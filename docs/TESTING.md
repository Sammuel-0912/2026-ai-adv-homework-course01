# TESTING.md — 測試規範

## 測試框架

- **Vitest** v2.1.9 — 測試執行器（Globals 模式，無需 import describe/it/expect）
- **Supertest** v7.2.2 — HTTP 請求斷言（直接對 Express app 發送請求，不需啟動伺服器）

---

## 測試執行

```bash
# 執行完整測試套件
npm test

# 執行單一測試檔案
npx vitest run tests/auth.test.js

# 監聽模式（開發時使用）
npx vitest
```

---

## 測試執行順序與依賴

測試檔案**必須循序執行**（`vitest.config.js` 設定 `fileParallelism: false`）。執行順序固定：

```
1. auth.test.js        ← 無依賴，建立基礎用戶
2. products.test.js    ← 無依賴，讀取種子商品
3. cart.test.js        ← 依賴 products（需商品 ID），支援訪客與會員兩種模式
4. orders.test.js      ← 依賴 auth（需 JWT）+ products（需有庫存商品）+ cart
5. adminProducts.test.js ← 依賴 auth（需 admin JWT）
6. adminOrders.test.js   ← 依賴 orders（需有訂單資料）
```

> **為何循序執行：** 所有測試共用同一個 SQLite 資料庫實例。若並行執行，各測試建立的資料（用戶、訂單、庫存）會相互干擾。

---

## 測試檔案說明

| 檔案 | 測試範圍 | 關鍵測試案例 |
|------|----------|------------|
| `auth.test.js` | 認證流程 | 成功註冊、重複 email 衝突、成功登入、錯誤密碼、profile 需 token |
| `products.test.js` | 商品 API | 商品列表（含分頁）、單一商品詳情、不存在的商品 404 |
| `cart.test.js` | 購物車操作 | 訪客 Session 購物車、會員 JWT 購物車、加入/更新/刪除、累加數量 |
| `orders.test.js` | 訂單流程 | 成功建立訂單、空購物車錯誤、未認證錯誤、訂單列表、訂單詳情、模擬付款 |
| `adminProducts.test.js` | 管理員商品 CRUD | 新增/更新/刪除商品、非管理員 403 |
| `adminOrders.test.js` | 管理員訂單 | 查詢所有訂單、status 篩選、訂單詳情含用戶資訊、非管理員 403 |

---

## 測試輔助函式（tests/setup.js）

### `getAdminToken()`

以預設管理員帳號登入，回傳 JWT token：

```javascript
const { getAdminToken } = require('./setup');

test('admin can create product', async () => {
  const token = await getAdminToken();
  const res = await request(app)
    .post('/api/admin/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: '測試商品', price: 100 });
  expect(res.status).toBe(201);
});
```

### `registerUser(overrides)`

註冊一個帶有隨機唯一 email 的新用戶（防止測試間衝突），回傳 `{ token, user }`：

```javascript
const { registerUser } = require('./setup');

test('user can view own orders', async () => {
  const { token } = await registerUser();
  // 使用 token 進行後續操作...
});

// 覆蓋預設欄位
const { token, user } = await registerUser({ name: '測試用戶', password: 'custom123' });
```

**`registerUser` 預設值：**
- `email`：`test-<uuid>@example.com`（每次不同）
- `password`：`password123`
- `name`：`測試用戶`

---

## 撰寫新測試

### 基本結構

```javascript
// tests/example.test.js
const request = require('supertest');
const app = require('../app');
const { getAdminToken, registerUser } = require('./setup');

describe('功能區塊名稱', () => {
  describe('GET /api/example', () => {
    it('成功取得資料', async () => {
      const res = await request(app).get('/api/example');
      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
      expect(res.body.data).toBeDefined();
    });

    it('未認證時回傳 401', async () => {
      const res = await request(app).get('/api/example/protected');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });
  });
});
```

### 需要 JWT 的測試

```javascript
it('已登入用戶可查詢訂單', async () => {
  const { token } = await registerUser();
  const res = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
});
```

### 需要管理員 JWT 的測試

```javascript
it('管理員可新增商品', async () => {
  const token = await getAdminToken();
  const res = await request(app)
    .post('/api/admin/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: '玫瑰', price: 500, stock: 10 });
  expect(res.status).toBe(201);
  expect(res.body.data.name).toBe('玫瑰');
});
```

### 購物車 Session 模式的測試

```javascript
it('訪客可使用 Session 購物車', async () => {
  const sessionId = 'test-session-' + Date.now();
  const res = await request(app)
    .get('/api/cart')
    .set('X-Session-Id', sessionId);
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual([]);
});
```

### 將新測試加入執行序列

在 `vitest.config.js` 的 `sequence.files` 陣列中，依執行順序加入新測試檔案：

```javascript
// vitest.config.js
sequence: {
  files: [
    'tests/auth.test.js',
    'tests/products.test.js',
    'tests/cart.test.js',
    'tests/orders.test.js',
    'tests/adminProducts.test.js',
    'tests/adminOrders.test.js',
    'tests/newFeature.test.js',  // 在此新增
  ]
}
```

---

## 常見陷阱

### 1. 庫存耗盡

`orders.test.js` 建立訂單時會扣除商品庫存。若後續測試需要特定商品庫存 > 0，需在測試前確認庫存或使用管理員 API 補充庫存。

### 2. Email 衝突

永遠使用 `registerUser()` 產生隨機 email，不要在測試中硬編碼 email（除非測試衝突情境本身）。

### 3. 測試間共享資料庫狀態

測試沒有在每次執行間 reset 資料庫。測試的斷言應考慮之前測試已植入的資料。例如：
- 商品列表的 `total` 會隨著 adminProducts 測試新增商品而增加
- 訂單列表包含所有先前建立的訂單

### 4. bcrypt 速度

`NODE_ENV=test` 時 `saltRounds = 1`（vs 正式的 10），確保 `getAdminToken()` 和 `registerUser()` 不會造成測試逾時。此設定已在 `database.js` 中處理，無需手動設定。

### 5. Vitest hook timeout

`vitest.config.js` 設定 `hookTimeout: 10000`（10 秒），登入/註冊的 async 操作不會超時。若新增需更長時間的 setup，需調整此設定。

---

## 測試覆蓋範圍說明

以下情境已有完整覆蓋：
- **認證：** 成功 / 重複 email / 錯誤密碼 / 無 token / 過期 token
- **購物車：** 訪客 Session 模式 / JWT 模式 / CRUD 操作 / 累加邏輯
- **訂單：** 正常建立 / 空購物車 / 庫存不足（待確認）/ 付款模擬（success/fail）
- **管理員：** 非 admin 403 / CRUD 成功 / 刪除有 pending 訂單的商品衝突

以下情境**尚未**有完整測試：
- 商品分頁（page > 1 的情境）
- 並發訂單庫存扣除
- JWT token 過期
- 無效的 UUID 格式
