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

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scroll-reveal: fade/slide sections up into view once, on first scroll past.
    var revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
      if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      } else {
        var revealObserver = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });
        revealEls.forEach(function (el) { revealObserver.observe(el); });
      }
    }

    // Count up the hero stats once they scroll into view.
    var statEls = document.querySelectorAll('.stat-num[data-count]');
    if (statEls.length) {
      var animateStat = function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        if (reduceMotion) {
          el.textContent = target.toLocaleString('en-US') + suffix;
          return;
        }
        var duration = 1100;
        var start = null;
        function step(ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      };
      if (!('IntersectionObserver' in window)) {
        statEls.forEach(animateStat);
      } else {
        var statObserver = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateStat(entry.target);
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.4 });
        statEls.forEach(function (el) { statObserver.observe(el); });
      }
    }
  });
})();
