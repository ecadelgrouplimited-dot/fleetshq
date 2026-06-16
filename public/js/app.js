/* ── 256 Logistics Compliance Hub — Client JS ────────────────────── */

// ── Toast system ──────────────────────────────────────────────────────
function showToast(message, type) {
  type = type || 'success';
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✓', error: '✕', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML =
    '<span class="toast-icon">' + (icons[type] || '●') + '</span>' +
    '<span>' + message + '</span>';

  container.appendChild(toast);

  setTimeout(function() {
    toast.style.transition = 'opacity .3s, transform .3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(10px)';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3800);
}

// ── Generic authenticated API fetch ───────────────────────────────────
function apiCall(method, url, body) {
  var token = (document.cookie.match(/token=([^;]+)/) || [])[1] || '';
  var opts = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(url, opts).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error && data.error.message || 'Request failed');
      return data;
    });
  });
}

// ── Confirm helper ────────────────────────────────────────────────────
function confirmAction(message, fn) {
  if (window.confirm(message)) fn();
}

// ── Active nav highlight ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var path = window.location.pathname;
  document.querySelectorAll('.sidebar nav a').forEach(function(a) {
    var href = a.getAttribute('href');
    if (href === path || (href !== '/' && path.startsWith(href))) {
      a.classList.add('active');
    }
  });
});
