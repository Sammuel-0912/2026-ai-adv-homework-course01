# CLAUDE.md

## 專案概述

花卉電商平台後端 (backend-project) — Node.js + Express.js REST API，搭配 SQLite 資料庫、EJS 伺服器端渲染、Vue.js 3 前端互動元件與 Tailwind CSS。提供完整的購物流程：商品瀏覽、購物車（訪客/會員雙模式）、訂單建立與模擬付款，以及管理員後台。

## 常用指令

```bash
# 啟動（建置 CSS + 啟動伺服器）
npm start

# 開發模式（不重新建置 CSS）
npm run dev:server

# 監聽 CSS 變更（搭配 dev:server 使用）
npm run dev:css

# 建置並壓縮 CSS
npm run css:build

# 執行測試（循序執行）
npm test

# 產生 OpenAPI 文件
npm run openapi
```

## 關鍵規則

- **回應格式統一**：所有 API 回應必須使用 `{ data, error, message }` 結構，message 使用繁體中文
- **雙模式購物車**：購物車同時支援 JWT（已登入用戶）與 `X-Session-Id` header（訪客），兩者不可混用
- **訂單建立必須用 transaction**：扣庫存、建訂單、清購物車三步驟需在 `db.transaction()` 中完成，確保原子性
- **測試循序執行**：`vitest.config.js` 已設定 `fileParallelism: false`，測試檔案按固定順序執行（auth → products → cart → orders → adminProducts → adminOrders），請勿變更
- **功能開發使用 docs/plans/ 記錄計畫；完成後移至 docs/plans/archive/**

## 詳細文件

- @./docs/README.md — 項目介紹與快速開始
- @./docs/ARCHITECTURE.md — 架構、目錄結構、資料流
- @./docs/DEVELOPMENT.md — 開發規範、命名規則
- @./docs/FEATURES.md — 功能列表與完成狀態
- @./docs/TESTING.md — 測試規範與指南
- @./docs/CHANGELOG.md — 更新日誌
