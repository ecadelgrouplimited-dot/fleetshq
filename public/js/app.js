/* ── 256 Logistics Compliance Hub — Client JS ────────────────────── */

// ── CSRF: auto-attach the double-submit token to same-origin mutations ──
function getCsrfToken() {
  var m = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}
(function() {
  var _fetch = window.fetch;
  var MUTATING = { POST: 1, PUT: 1, PATCH: 1, DELETE: 1 };
  window.fetch = function(input, init) {
    init = init || {};
    var method = (init.method || (input && input.method) || 'GET').toUpperCase();
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var sameOrigin = url.indexOf('http') !== 0 || url.indexOf(window.location.origin) === 0;
    if (sameOrigin && MUTATING[method]) {
      var headers = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
      if (!headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', getCsrfToken());
      init.headers = headers;
      if (init.credentials === undefined) init.credentials = 'same-origin';
    }
    return _fetch.call(this, input, init);
  };
})();

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

// ── Global form confirm ─────────────────────────────────────────────────
// Any <form data-confirm="…"> uses the branded dialog above instead of the
// browser's native confirm() popup — no per-page wiring needed. Optional:
// data-confirm-title, data-confirm-tone ("danger"|"primary"),
// data-confirm-label, data-confirm-cancel-label.
document.addEventListener('submit', function(event) {
  var form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  var message = form.getAttribute('data-confirm');
  if (!message || form.dataset.confirmed === '1') return;
  event.preventDefault();
  showConfirmDialog({
    title: form.getAttribute('data-confirm-title') || 'Confirm action',
    message: message,
    confirmLabel: form.getAttribute('data-confirm-label') || 'Confirm',
    cancelLabel: form.getAttribute('data-confirm-cancel-label') || 'Cancel',
    tone: form.getAttribute('data-confirm-tone') || 'primary',
  }).then(function(confirmed) {
    if (!confirmed) return;
    form.dataset.confirmed = '1';
    // .requestSubmit() (not .submit()) re-runs the submit event — but our
    // guard above short-circuits it this time — and preserves the clicked
    // submit button's name/value if the form has more than one action.
    if (form.requestSubmit) form.requestSubmit();
    else form.submit();
  });
});

// ── Button loading state ──────────────────────────────────────────────
function setButtonLoading(btn, loading, loadingText) {
  if (!btn) return;
  if (loading) {
    if (!btn.hasAttribute('data-orig-text')) btn.setAttribute('data-orig-text', btn.innerHTML);
    btn.innerHTML = (loadingText || btn.getAttribute('data-loading-text') || 'Working…');
    btn.disabled = true;
    btn.classList.add('is-loading');
  } else {
    var orig = btn.getAttribute('data-orig-text');
    if (orig != null) { btn.innerHTML = orig; btn.removeAttribute('data-orig-text'); }
    btn.disabled = false;
    btn.classList.remove('is-loading');
  }
}

// ── Global modal: ESC key + backdrop click to close ───────────────────
// Handles any .modal-overlay with display != 'none' (excludes confirm dialog)
(function() {
  function closeTopModal() {
    var overlays = Array.from(document.querySelectorAll('.modal-overlay:not(.modal-confirm-overlay)'));
    var visible = overlays.filter(function(o) {
      return o.style.display !== 'none' && o.style.display !== '';
    });
    // Also handle overlays that use flex (set by inline style when open)
    var flexVisible = overlays.filter(function(o) {
      return o.style.display === 'flex';
    });
    var target = flexVisible[flexVisible.length - 1] || visible[visible.length - 1];
    if (target) {
      target.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeTopModal();
  });

  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('modal-overlay') &&
        !e.target.classList.contains('modal-confirm-overlay')) {
      e.target.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
  });
})();

// ── Mobile nav drawer ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var sidebar = document.getElementById('appSidebar');
  var toggle = document.getElementById('navToggle');
  var overlay = document.getElementById('sidebarOverlay');
  if (sidebar && toggle && overlay) {
    var open = function() {
      sidebar.classList.add('open');
      overlay.hidden = false;
      // next frame so the opacity transition runs
      requestAnimationFrame(function() { overlay.classList.add('show'); });
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    };
    var close = function() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      setTimeout(function() { overlay.hidden = true; }, 260);
    };
    var isOpen = function() { return sidebar.classList.contains('open'); };

    toggle.addEventListener('click', function() { isOpen() ? close() : open(); });
    overlay.addEventListener('click', close);
    // Close after tapping a destination
    sidebar.querySelectorAll('nav a, .signout').forEach(function(a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && isOpen()) close(); });
    // Reset when leaving mobile width
    window.addEventListener('resize', function() {
      if (window.innerWidth > 900 && isOpen()) close();
    });
  }
});

// ── Active nav highlight ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var path = window.location.pathname;
  document.querySelectorAll('.sidebar nav a').forEach(function(a) {
    var href = a.getAttribute('href');
    if (href === path || (href !== '/' && path.startsWith(href))) {
      a.classList.add('active');
    }
  });

  var safeQuery = function(selector) {
    return selector ? document.querySelector(selector) : null;
  };

  document.querySelectorAll('[data-live-search]').forEach(function(input) {
    var target = safeQuery(input.getAttribute('data-live-search'));
    var countTarget = safeQuery(input.getAttribute('data-live-count'));
    if (!target) return;
    var rows = Array.from(target.querySelectorAll('[data-search-row]'));
    var empty = safeQuery(input.getAttribute('data-live-empty'));
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

  document.querySelectorAll('[data-loading-link]').forEach(function(link) {
    link.addEventListener('click', function() {
      if (link.classList.contains('is-loading')) return;
      var label = link.querySelector('[data-loading-label]');
      link.classList.add('is-loading');
      link.setAttribute('aria-busy', 'true');
      if (label && !label.getAttribute('data-original-label')) {
        label.setAttribute('data-original-label', label.textContent);
        label.textContent = link.getAttribute('data-loading-text') || 'Working...';
      }
    });
  });

  // Auto-loading state on form submit buttons (prevents double-submit)
  // Also adds submit-attempted class for client-side :invalid styling (G-05)
  document.querySelectorAll('form[data-form-loading], form[method="post"]').forEach(function(form) {
    form.addEventListener('submit', function() {
      form.classList.add('submit-attempted');
      var btn = form.querySelector('button[type="submit"], button:not([type="button"])');
      if (btn && !btn.disabled) {
        setButtonLoading(btn, true);
        // Restore after 10s as a safety net (if the page stays, e.g. validation error response)
        setTimeout(function() { setButtonLoading(btn, false); }, 10000);
      }
    });
  });

  document.querySelectorAll('[data-export-selector]').forEach(function(host) {
    var trigger = host.querySelector('[data-export-trigger]');
    var filename = host.querySelector('[data-export-filename]');
    var detailTitle = host.querySelector('[data-export-title]');
    var detailDescription = host.querySelector('[data-export-description]');
    var detailPack = host.querySelector('[data-export-pack]');
    var options = Array.from(host.querySelectorAll('[data-export-option]'));
    if (!trigger || !options.length) return;

    var activate = function(option) {
      options.forEach(function(item) {
        item.classList.toggle('active', item === option);
        item.setAttribute('aria-pressed', item === option ? 'true' : 'false');
      });

      trigger.setAttribute('href', option.getAttribute('data-export-href'));
      trigger.setAttribute('data-loading-text', option.getAttribute('data-loading-text') || 'Preparing export...');
      if (filename) filename.textContent = option.getAttribute('data-export-file') || '';
      if (detailTitle) detailTitle.textContent = option.getAttribute('data-export-title') || '';
      if (detailDescription) detailDescription.textContent = option.getAttribute('data-export-description') || '';
      if (detailPack) detailPack.textContent = option.getAttribute('data-export-pack') || '';

      var triggerLabel = trigger.querySelector('[data-loading-label]');
      if (triggerLabel) {
        triggerLabel.textContent = option.getAttribute('data-export-button') || 'Export';
      }
    };

    options.forEach(function(option) {
      option.addEventListener('click', function() { activate(option); });
    });

    activate(options[0]);
  });
});
