---
name: e2e-checkout
version: "1.0.0"
description: >
  花卉電商平台 E2E 結帳流程測試（e2e, 端對端測試, E2E測試, 結帳測試, checkout test,
  /e2e-checkout）。完整流程：伺服器確認 → 登入 → 加入購物車 → 填寫收件資訊 →
  建立訂單 → 綠界網路ATM付款（臺灣土地銀行）。
  測試結束後逐步顯示所有截圖。
metadata:
  author: FlowerLife Dev Team
  platforms: [claude-code]
---

# E2E 結帳流程測試

本 Skill 對花卉電商平台執行完整的端對端結帳測試，涵蓋從首頁瀏覽到綠界 ATM 付款的全流程，並在每個關鍵步驟截圖存檔，測試完成後逐一顯示截圖摘要。

---

## 預設測試參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `帳號` | `admin@hexschool.com` | 登入帳號 |
| `密碼` | `12345678` | 登入密碼 |
| `收件人` | `測試用戶` | 訂單收件人姓名 |
| `收件Email` | `admin@hexschool.com` | 訂單收件人 Email |
| `收件地址` | `台北市信義區信義路五段7號` | 收件地址 |

用戶可在呼叫時覆蓋任意參數，例如：`/e2e-checkout 帳號=user@test.com 密碼=pass123`

---

## 執行規則

1. **逐步執行**：每個步驟完成並驗證後，才進行下一步
2. **截圖固定命名**：每次執行覆蓋上一次的截圖（`e2e-step-01-homepage.png` … `e2e-step-08-atm-success.png`），所有截圖存放於專案根目錄
3. **失敗即停**：任何步驟驗證失敗，立刻停止並回報失敗原因與截圖
4. **全程繁體中文**：輸出訊息使用繁體中文
5. **結束後顯示截圖**：測試結束後，使用 Read 工具逐一讀取並顯示所有截圖，再輸出步驟結果表格

---

## 步驟一：確認伺服器並開啟首頁

**動作：**
1. 以 Bash 執行 `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001` 確認 port 3001 狀態
2. 若回傳非 `200`，在專案目錄（`C:\Users\sam60\2026-ai-adv-homework-course01`）背景執行 `npm run dev:server`，等待 3 秒後再確認一次
3. 使用 Playwright `browser_navigate` 導覽至 `http://localhost:3001`
4. 截圖：`e2e-step-01-homepage.png`

**驗證：** 頁面標題（Page Title）包含 `Flower Life`

---

## 步驟二：登入

**動作：**
1. `browser_click` → `.navbar a[href="/login"]`（導覽列登入按鈕）
2. `browser_fill_form` → 填入帳號（`input[type='email']`）與密碼（`input[type='password']`）
3. `browser_click` → `button:has-text('登入帳號')`
4. 截圖：`e2e-step-02-logged-in.png`

**驗證：** 截圖中導覽列出現用戶名稱與「登出」文字（由 `header-init.js` 注入）

---

## 步驟三：加入購物車

**動作：**
1. 確認目前在首頁（`http://localhost:3001/`）
2. `browser_snapshot` 取得商品列表區塊，找到第一個可見的「加入購物車」按鈕
3. `browser_click` → `getByRole('button', { name: '加入購物車' }).first()`
4. 截圖：`e2e-step-03-cart-added.png`

**驗證：** 截圖中導覽列購物車圖示出現數字 badge

---

## 步驟四：進入購物車確認

**動作：**
1. `browser_navigate` → `http://localhost:3001/cart`
2. 截圖：`e2e-step-04-cart.png`

**驗證：** 截圖中購物車頁面顯示至少一項商品，且有「前往結帳」按鈕

---

## 步驟五：填寫收件資訊並建立訂單

**動作：**
1. `browser_click` → `button:has-text('前往結帳')`（應跳轉至 `/checkout`）
2. `browser_fill_form` → 填入收件人姓名（`input[placeholder='請輸入收件人姓名']`）、Email（`input[placeholder='請輸入 Email']`）、地址（`input[placeholder='請輸入收件地址']`）
3. `browser_click` → `button:has-text('確認送出訂單')`
4. 截圖：`e2e-step-05-order-created.png`

**驗證：** 目前 URL 包含 `/orders/`，截圖中顯示訂單編號（`ORD-` 開頭）與「待付款」狀態標籤

---

## 步驟六：前往綠界付款

**動作：**
1. 使用 `browser_snapshot` 確認「前往綠界付款」按鈕存在（Vue 渲染完成）
2. `browser_click` → `button:has-text('前往綠界付款')`（頁面將 POST form submit 並跳轉）
3. 截圖：`e2e-step-06-ecpay.png`

**驗證：** 目前 URL 包含 `payment-stage.ecpay.com.tw`，截圖顯示綠界付款頁面與商品明細

---

## 步驟七：選擇網路ATM與臺灣土地銀行

**動作：**
1. `browser_click` → `text=網路ATM`（付款方式選項）
2. `browser_fill_form` → `#selWebATMBank` combobox 選取 `台灣土地銀行`
3. 截圖：`e2e-step-07-bank-selected.png`

**驗證：** 截圖中「網路ATM」按鈕呈現選取狀態（深色背景），銀行下拉顯示「台灣土地銀行」

---

## 步驟八：送出網路ATM付款

**動作：**
1. `browser_click` → `#WebATMSubmit`（網路ATM送出按鈕）
   - 若 `#WebATMSubmit` 不存在，使用 evaluate 找出 visible 的送出連結：`document.querySelector('a[id*="WebATM"]')` 或 `a:has-text('前往付款')`
2. 截圖：`e2e-step-08-atm-success.png`（full page）

**驗證：** 頁面 URL 包含 `WebATM` 或頁面標題含「網路ATM」相關文字，或成功跳轉至銀行付款頁面

---

## 結果輸出

所有步驟完成後，依序執行以下輸出：

### 1. 逐一顯示截圖

使用 `Read` 工具依序讀取並顯示：
- `e2e-step-01-homepage.png`
- `e2e-step-02-logged-in.png`
- `e2e-step-03-cart-added.png`
- `e2e-step-04-cart.png`
- `e2e-step-05-order-created.png`
- `e2e-step-06-ecpay.png`
- `e2e-step-07-bank-selected.png`
- `e2e-step-08-atm-success.png`

### 2. 輸出步驟結果表格

```
| 步驟 | 描述 | 結果 |
|------|------|------|
| 1 | 首頁載入 | ✅ / ❌ |
| 2 | 登入成功 | ✅ / ❌ |
| 3 | 加入購物車 | ✅ / ❌ |
| 4 | 購物車確認 | ✅ / ❌ |
| 5 | 訂單建立 | ✅ / ❌ |
| 6 | 跳轉綠界 | ✅ / ❌ |
| 7 | 選擇銀行 | ✅ / ❌ |
| 8 | ATM 訂單成立 | ✅ / ❌ |
```

若所有步驟均為 ✅，輸出：`🎉 E2E 測試通過！完整結帳流程驗證成功。`
若有步驟失敗，輸出：`❌ 第 N 步失敗：<失敗原因>，請檢查上方截圖。`
