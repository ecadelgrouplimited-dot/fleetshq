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
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showConfirmDialog(options) {
  options = options || {};
  var host = document.getElementById('confirmDialogHost');
  if (!host) return Promise.resolve(window.confirm(options.message || 'Are you sure?'));

  return new Promise(function(resolve) {
    var title = escapeHtml(options.title || 'Confirm Action');
    var message = escapeHtml(options.message || 'Are you sure you want to continue?').replace(/\n/g, '<br>');
    var confirmLabel = escapeHtml(options.confirmLabel || 'Confirm');
    var cancelLabel = escapeHtml(options.cancelLabel || 'Cancel');
    var toneClass = options.tone === 'danger' ? 'btn-danger' : 'btn-primary';

    host.innerHTML =
      '<div class="modal-overlay modal-confirm-overlay">' +
        '<div class="modal modal-confirm" role="dialog" aria-modal="true" aria-labelledby="confirmDialogTitle">' +
          '<div class="modal-header">' +
            '<h3 id="confirmDialogTitle">' + title + '</h3>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-confirm-close>Close</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<p class="confirm-dialog-message">' + message + '</p>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-ghost" data-confirm-cancel>' + cancelLabel + '</button>' +
            '<button type="button" class="btn ' + toneClass + '" data-confirm-ok>' + confirmLabel + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var overlay = host.querySelector('.modal-confirm-overlay');
    var confirmButton = host.querySelector('[data-confirm-ok]');
    var cancelButton = host.querySelector('[data-confirm-cancel]');
    var closeButton = host.querySelector('[data-confirm-close]');
    var previousOverflow = document.body.style.overflow;

    function teardown(result) {
      document.removeEventListener('keydown', onKeydown);
      document.body.style.overflow = previousOverflow;
      host.innerHTML = '';
      resolve(result);
    }

    function onKeydown(event) {
      if (event.key === 'Escape') teardown(false);
      if (event.key === 'Enter') teardown(true);
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);

    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) teardown(false);
    });
    cancelButton.addEventListener('click', function() { teardown(false); });
    closeButton.addEventListener('click', function() { teardown(false); });
    confirmButton.addEventListener('click', function() { teardown(true); });
    confirmButton.focus();
  });
}

function confirmAction(message, fn, options) {
  options = options || {};
  options.message = message;
  return showConfirmDialog(options).then(function(confirmed) {
    if (confirmed && typeof fn === 'function') return fn();
    return confirmed;
  });
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
