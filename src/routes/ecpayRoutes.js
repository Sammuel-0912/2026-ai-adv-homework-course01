'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const authMiddleware = require('../middleware/authMiddleware');
const {
  AIO_ENDPOINT,
  generateCheckMacValue,
  verifyCheckMacValue,
  buildPaymentParams,
  queryTradeInfo,
} = require('../utils/ecpay');

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/ecpay/checkout/:orderId
// 產生綠界 AIO 付款表單參數，回傳給前端動態提交
// ---------------------------------------------------------------------------
router.post('/api/ecpay/checkout/:orderId', authMiddleware, (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = db.prepare(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?'
    ).get(orderId, userId);

    if (!order) {
      return res.status(404).json({ data: null, error: 'NOT_FOUND', message: '訂單不存在' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({
        data: null,
        error: 'INVALID_STATUS',
        message: '訂單狀態不是 pending，無法付款',
      });
    }

    // 每次發起付款都產生新的 MerchantTradeNo（英數字，最長 20 碼）
    const merchantTradeNo = uuidv4().replace(/-/g, '').slice(0, 20);
    db.prepare('UPDATE orders SET merchant_trade_no = ? WHERE id = ?').run(merchantTradeNo, orderId);

    const orderItems = db.prepare(
      'SELECT product_name, product_price, quantity FROM order_items WHERE order_id = ?'
    ).all(orderId);

    const params = buildPaymentParams({ ...order, merchant_trade_no: merchantTradeNo }, orderItems);
    params.CheckMacValue = generateCheckMacValue(params);

    return res.json({
      data: { action: AIO_ENDPOINT, method: 'POST', params },
      error: null,
      message: '已產生付款資訊',
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/ecpay/query/:orderId
// 主動呼叫綠界 QueryTradeInfo API 確認付款狀態
// ---------------------------------------------------------------------------
router.post('/api/ecpay/query/:orderId', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = db.prepare(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?'
    ).get(orderId, userId);

    if (!order) {
      return res.status(404).json({ data: null, error: 'NOT_FOUND', message: '訂單不存在' });
    }
    if (!order.merchant_trade_no) {
      return res.status(400).json({
        data: null,
        error: 'NOT_INITIATED',
        message: '尚未發起過綠界付款，無法查詢',
      });
    }

    const result = await queryTradeInfo(order.merchant_trade_no);

    // TradeStatus '1' = 付款成功
    if (result.tradeStatus === '1' && order.status !== 'paid') {
      db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(orderId);
    }

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    return res.json({
      data: {
        order: updatedOrder,
        ecpay: {
          tradeStatus: result.tradeStatus,
          paymentType: result.paymentType,
          tradeAmt: result.tradeAmt,
          tradeDate: result.tradeDate,
        },
      },
      error: null,
      message: result.tradeStatus === '1' ? '付款已確認' : '尚未付款或付款失敗',
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /ecpay/return  (ReturnURL — Server-to-Server)
// 本地環境收不到此 callback，但端點必須存在；正式環境用
// ⚠️ 必須回傳純文字 '1|OK'，HTTP 200
// ---------------------------------------------------------------------------
router.post('/ecpay/return', (req, res) => {
  if (!verifyCheckMacValue(req.body)) {
    console.error('[ECPay ReturnURL] CheckMacValue 驗證失敗', req.body);
    return res.type('text').send('1|OK'); // 仍需回 1|OK 避免重複重試
  }

  const { RtnCode, CustomField1: orderId } = req.body;

  if (RtnCode === '1' && orderId) {
    const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId);
    if (order && order.status === 'pending') {
      db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(orderId);
      console.log(`[ECPay ReturnURL] 訂單 ${orderId} 付款成功，狀態已更新`);
    }
  }

  res.type('text').send('1|OK');
});

// ---------------------------------------------------------------------------
// POST /ecpay/order-result  (OrderResultURL — 瀏覽器跳轉)
// 付款完成後，ECPay 由用戶瀏覽器 POST 結果至此，本地環境可正常接收
// ---------------------------------------------------------------------------
router.post('/ecpay/order-result', (req, res) => {
  const { RtnCode, CustomField1: orderId } = req.body;

  if (!verifyCheckMacValue(req.body)) {
    console.error('[ECPay OrderResultURL] CheckMacValue 驗證失敗');
    // 驗證失敗仍跳回訂單頁，顯示錯誤
    if (orderId) return res.redirect(`/orders/${orderId}?payment=failed`);
    return res.redirect('/orders');
  }

  if (!orderId) {
    console.error('[ECPay OrderResultURL] 缺少 CustomField1 (orderId)');
    return res.redirect('/orders');
  }

  const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    console.error(`[ECPay OrderResultURL] 訂單 ${orderId} 不存在`);
    return res.redirect('/orders');
  }

  if (order.status === 'pending') {
    const newStatus = RtnCode === '1' ? 'paid' : 'failed';
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, orderId);
    console.log(`[ECPay OrderResultURL] 訂單 ${orderId} 狀態 → ${newStatus}`);
  }

  const paymentParam = RtnCode === '1' ? 'success' : 'failed';
  res.redirect(`/orders/${orderId}?payment=${paymentParam}`);
});

module.exports = router;
