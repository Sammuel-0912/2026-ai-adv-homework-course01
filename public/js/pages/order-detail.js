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
      pending: { label: '待付款', cls: 'bg-apricot/20 text-apricot' },
      paid: { label: '已付款', cls: 'bg-sage/20 text-sage' },
      failed: { label: '付款失敗', cls: 'bg-red-100 text-red-600' },
    };

    const paymentMessages = {
      success: { text: '付款成功！感謝您的購買。', cls: 'bg-sage/10 text-sage border border-sage/20' },
      failed: { text: '付款失敗，請重試或聯絡客服。', cls: 'bg-red-50 text-red-600 border border-red-100' },
      cancel: { text: '付款已取消。', cls: 'bg-apricot/10 text-apricot border border-apricot/20' },
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
