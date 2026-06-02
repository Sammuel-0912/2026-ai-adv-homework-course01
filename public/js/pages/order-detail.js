const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    if (!Auth.requireAuth()) return {};

    const el = document.getElementById('app');
    const orderId = el.dataset.orderId;
    const paymentResult = ref(el.dataset.paymentResult || null);

    const order = ref(null);
    const loading = ref(true);
    const paying = ref(false);
    const querying = ref(false);

    const statusMap = {
      pending: { label: '待付款', style: 'background:rgba(207,138,82,.15);color:#B8651A;' },
      paid:    { label: '已付款', style: 'background:rgba(61,122,92,.15);color:#3D7A5C;' },
      failed:  { label: '付款失敗', style: 'background:#fee2e2;color:#dc2626;' },
    };

    const paymentMessages = {
      success: { text: '付款成功！感謝您的購買。', style: 'background:rgba(61,122,92,.08);color:#3D7A5C;border:1px solid rgba(61,122,92,.2);' },
      failed:  { text: '付款失敗，請重試或聯絡客服。', style: 'background:#fef2f2;color:#dc2626;border:1px solid #fee2e2;' },
      cancel:  { text: '付款已取消。', style: 'background:rgba(207,138,82,.08);color:#B8651A;border:1px solid rgba(207,138,82,.2);' },
    };

    // 前往綠界付款：取得表單參數後動態 submit
    async function goToECPay() {
      if (!order.value || paying.value) return;
      paying.value = true;
      try {
        const res = await apiFetch('/api/ecpay/checkout/' + orderId, { method: 'POST' });
        if (res.error) {
          Notification.show(res.message || '付款啟動失敗', 'error');
          return;
        }
        const { action, method, params } = res.data;
        const form = document.createElement('form');
        form.method = method;
        form.action = action;
        Object.entries(params).forEach(([k, v]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = k;
          input.value = v;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } catch (e) {
        Notification.show('付款啟動失敗，請稍後再試', 'error');
        paying.value = false;
      }
    }

    // 主動查詢綠界付款狀態
    async function queryPaymentStatus() {
      if (!order.value || querying.value) return;
      querying.value = true;
      try {
        const res = await apiFetch('/api/ecpay/query/' + orderId, { method: 'POST' });
        if (res.error) {
          Notification.show(res.message || '查詢失敗', 'error');
          return;
        }
        order.value = res.data.order;
        const ts = res.data.ecpay.tradeStatus;
        if (ts === '1') {
          paymentResult.value = 'success';
          Notification.show('查詢結果：付款已確認', 'success');
        } else {
          Notification.show('查詢結果：尚未付款或付款失敗', 'warning');
        }
      } catch (e) {
        Notification.show('查詢失敗，請稍後再試', 'error');
      } finally {
        querying.value = false;
      }
    }

    onMounted(async function () {
      try {
        const res = await apiFetch('/api/orders/' + orderId);
        order.value = res.data;
      } catch (e) {
        Notification.show('載入訂單失敗', 'error');
      } finally {
        loading.value = false;
      }
    });

    return {
      order, loading, paying, querying, paymentResult,
      statusMap, paymentMessages,
      goToECPay, queryPaymentStatus,
    };
  }
}).mount('#app');
