'use strict';

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const MERCHANT_ID = process.env.ECPAY_MERCHANT_ID || '3002607';
const HASH_KEY    = process.env.ECPAY_HASH_KEY    || 'pwFHCqoQZGmho4w6';
const HASH_IV     = process.env.ECPAY_HASH_IV     || 'EkRm7iFT261dpevs';
const IS_STAGING  = (process.env.ECPAY_ENV || 'staging') !== 'production';

const AIO_ENDPOINT   = IS_STAGING
  ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
  : 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

const QUERY_HOSTNAME = IS_STAGING ? 'payment-stage.ecpay.com.tw' : 'payment.ecpay.com.tw';
const QUERY_PATH     = '/Cashier/QueryTradeInfo/V5';

// ---------------------------------------------------------------------------
// CheckMacValue — CMV-SHA256 (AIO 金流專用)
// 演算法：encodeURIComponent → 替換 → toLowerCase → .NET 字元還原 → SHA256 → 大寫
// ---------------------------------------------------------------------------
function ecpayUrlEncode(str) {
  let encoded = encodeURIComponent(String(str))
    .replace(/%20/g, '+')
    .replace(/~/g, '%7e')
    .replace(/'/g, '%27');

  encoded = encoded.toLowerCase();

  // .NET WebUtility.UrlEncode 特殊字元還原
  const dotNetRestore = {
    '%2d': '-', '%5f': '_', '%2e': '.', '%21': '!',
    '%2a': '*', '%28': '(', '%29': ')',
  };
  for (const [old, ch] of Object.entries(dotNetRestore)) {
    encoded = encoded.split(old).join(ch);
  }
  return encoded;
}

function generateCheckMacValue(params) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([k]) => k !== 'CheckMacValue')
  );

  const sorted = Object.keys(filtered)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const raw = `HashKey=${HASH_KEY}&` +
    sorted.map(k => `${k}=${filtered[k]}`).join('&') +
    `&HashIV=${HASH_IV}`;

  const encoded = ecpayUrlEncode(raw);
  return crypto.createHash('sha256').update(encoded, 'utf8').digest('hex').toUpperCase();
}

function verifyCheckMacValue(params) {
  const received = (params.CheckMacValue || '').toUpperCase();
  const calculated = generateCheckMacValue(params);

  const bufA = Buffer.from(calculated);
  const bufB = Buffer.from(received);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// 日期時間 — 必須使用 UTC+8，格式 'yyyy/MM/dd HH:mm:ss'
// ---------------------------------------------------------------------------
function getTaiwanDateString() {
  const now = new Date();
  const offset = 8 * 60 - now.getTimezoneOffset(); // 分鐘差
  const tw = new Date(now.getTime() + offset * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${tw.getFullYear()}/${pad(tw.getMonth() + 1)}/${pad(tw.getDate())} ` +
         `${pad(tw.getHours())}:${pad(tw.getMinutes())}:${pad(tw.getSeconds())}`;
}

// ---------------------------------------------------------------------------
// 建立 AIO 付款表單參數（尚未含 CheckMacValue）
// ---------------------------------------------------------------------------
function buildPaymentParams(order, orderItems) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  // ItemName: '商品名 x數量#商品名 x數量'，截斷至 200 字元防 CheckMacValue 錯誤
  let itemName = orderItems
    .map(i => `${i.product_name} x${i.quantity}`)
    .join('#');
  if (itemName.length > 200) {
    itemName = itemName.slice(0, 197) + '...';
  }

  return {
    MerchantID:        MERCHANT_ID,
    MerchantTradeNo:   order.merchant_trade_no,
    MerchantTradeDate: getTaiwanDateString(),
    PaymentType:       'aio',
    TotalAmount:       order.total_amount,
    TradeDesc:         '花卉電商訂單',
    ItemName:          itemName,
    ReturnURL:         `${baseUrl}/ecpay/return`,
    OrderResultURL:    `${baseUrl}/ecpay/order-result`,
    ClientBackURL:     `${baseUrl}/orders/${order.id}`,
    ChoosePayment:     'ALL',
    EncryptType:       1,
    CustomField1:      order.id,   // 用於 OrderResultURL 回查訂單
  };
}

// ---------------------------------------------------------------------------
// QueryTradeInfo — 主動查詢綠界付款狀態
// 回傳 { tradeStatus, paymentType, tradeAmt, tradeDate, raw }
// ---------------------------------------------------------------------------
function queryTradeInfo(merchantTradeNo) {
  return new Promise((resolve, reject) => {
    const params = {
      MerchantID:      MERCHANT_ID,
      MerchantTradeNo: merchantTradeNo,
      TimeStamp:       Math.floor(Date.now() / 1000),
    };
    params.CheckMacValue = generateCheckMacValue(params);

    const postData = querystring.stringify(params);
    const options = {
      hostname: QUERY_HOSTNAME,
      port: 443,
      path: QUERY_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = querystring.parse(data);
          resolve({
            tradeStatus: result.TradeStatus,   // '1' = 付款成功
            paymentType: result.PaymentType,
            tradeAmt:    result.TradeAmt,
            tradeDate:   result.TradeDate,
            raw:         result,
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

module.exports = {
  AIO_ENDPOINT,
  generateCheckMacValue,
  verifyCheckMacValue,
  buildPaymentParams,
  queryTradeInfo,
};
