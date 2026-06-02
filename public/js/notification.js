const Notification = {
  _timeout: null,

  show(message, type = 'info') {
    const el = document.getElementById('notification-toast');
    if (!el) return;

    const typeClass = {
      success: 'fl-toast-success',
      error:   'fl-toast-error',
      warning: 'fl-toast-warning',
      info:    'fl-toast-info'
    };

    el.className = 'fl-toast ' + (typeClass[type] || typeClass.info);
    el.textContent = message;
    el.style.display = 'block';
    el.style.opacity = '1';

    if (this._timeout) clearTimeout(this._timeout);
    this._timeout = setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => { el.style.display = 'none'; }, 300);
    }, 3000);
  }
};
