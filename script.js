// ALPATAI project site — language toggle + paper-embed lazy loading
// Note: the *initial* language is set synchronously by an inline <script> in
// each page's <head> (before first paint) to avoid a flash of the wrong
// language. This file only wires up interactivity after the DOM is ready.

(function () {
  function currentLang() {
    return document.documentElement.getAttribute('data-active-lang') || 'en';
  }

  function setLang(lang) {
    document.documentElement.setAttribute('data-active-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem('alpatai-lang', lang); } catch (e) { /* ignore */ }
    document.querySelectorAll('.lang-toggle-btn').forEach(function (btn) {
      btn.textContent = lang === 'de' ? 'EN' : 'DE';
      btn.setAttribute('aria-label', lang === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln');
    });
  }

  function toggleLang() {
    setLang(currentLang() === 'de' ? 'en' : 'de');
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Sync button labels with whatever the inline head-script already set.
    setLang(currentLang());
    document.querySelectorAll('.lang-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', toggleLang);
    });

    // Lazy-load OSF preprint embeds only when requested, so papers.html
    // stays fast even as more working papers are added.
    document.querySelectorAll('.show-preprint-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wrap = document.getElementById(btn.getAttribute('data-target'));
        if (!wrap || wrap.dataset.loaded === 'true') return;
        var iframe = document.createElement('iframe');
        iframe.src = btn.getAttribute('data-embed-url');
        iframe.title = btn.getAttribute('data-embed-title') || 'Embedded preprint PDF';
        iframe.setAttribute('scrolling', 'yes');
        iframe.setAttribute('frameborder', '0');
        wrap.appendChild(iframe);
        wrap.dataset.loaded = 'true';
        wrap.hidden = false;
        btn.hidden = true;
      });
    });
  });
})();
