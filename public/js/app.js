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
  var opts = {
    method: method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
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

  document.querySelectorAll('[data-live-search]').forEach(function(input) {
    var target = document.querySelector(input.getAttribute('data-live-search'));
    var countTarget = document.querySelector(input.getAttribute('data-live-count') || '');
    if (!target) return;
    var rows = Array.from(target.querySelectorAll('[data-search-row]'));
    var empty = document.querySelector(input.getAttribute('data-live-empty') || '');
    var update = function() {
      var q = input.value.trim().toLowerCase();
      var visible = 0;
      rows.forEach(function(row) {
        var text = (row.getAttribute('data-search-text') || row.textContent || '').toLowerCase();
        var match = !q || text.indexOf(q) !== -1;
        row.style.display = match ? '' : 'none';
        if (match) visible += 1;
      });
      if (countTarget) countTarget.textContent = String(visible);
      if (empty) empty.style.display = visible ? 'none' : '';
    };
    input.addEventListener('input', update);
    update();
  });
});
