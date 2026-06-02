const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    if (!Auth.requireAuth()) return {};

    const orders = ref([]);
    const loading = ref(true);

    const statusMap = {
      pending: { label: '待付款', style: 'background:rgba(207,138,82,.15);color:#B8651A;' },
      paid:    { label: '已付款', style: 'background:rgba(61,122,92,.15);color:#3D7A5C;' },
      failed:  { label: '付款失敗', style: 'background:#fee2e2;color:#dc2626;' },
    };

    onMounted(async function () {
      try {
        const res = await apiFetch('/api/orders');
        orders.value = res.data.orders;
      } catch (e) {
        orders.value = [];
      } finally {
        loading.value = false;
      }
    });

    return { orders, loading, statusMap };
  }
}).mount('#app');
