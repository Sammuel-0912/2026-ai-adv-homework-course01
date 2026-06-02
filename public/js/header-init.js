document.addEventListener('DOMContentLoaded', function () {
  const authNav = document.getElementById('auth-nav');
  const cartBadge = document.getElementById('cart-badge');
  const ordersLink = document.getElementById('orders-link');

  if (authNav) {
    if (Auth.isLoggedIn()) {
      const user = Auth.getUser();
      let html = '';
      if (Auth.isAdmin()) {
        html += '<a href="/admin/products" style="font-size:.78rem;color:var(--maroon);text-decoration:none;font-weight:600;letter-spacing:.06em;">後台管理</a>';
      }
      html += '<span style="font-size:.82rem;color:var(--text-muted-c);">' + (user?.name || '') + '</span>';
      html += '<button onclick="Auth.logout()" style="background:none;border:none;font-size:.78rem;color:var(--text-muted-c);cursor:pointer;padding:0;font-family:Jost,sans-serif;letter-spacing:.06em;" onmouseover="this.style.color=\'var(--maroon)\'" onmouseout="this.style.color=\'var(--text-muted-c)\'">登出</button>';
      authNav.innerHTML = html;
      authNav.style.display = 'flex';
      authNav.style.alignItems = 'center';
      authNav.style.gap = '.85rem';
    } else {
      authNav.innerHTML = '<a href="/login" class="btn-outline-maroon" style="font-size:.75rem;padding:.5rem 1.2rem;">登入</a>';
    }
  }

  if (ordersLink) {
    ordersLink.style.display = Auth.isLoggedIn() ? '' : 'none';
  }

  if (cartBadge) {
    apiFetch('/api/cart').then(function (res) {
      if (res && res.data && res.data.items && res.data.items.length > 0) {
        cartBadge.textContent = res.data.items.length;
        cartBadge.style.display = 'flex';
      }
    }).catch(function () {});
  }
});
