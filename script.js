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
    var map = document.querySelector('.parl-map[data-aria-en]');
    if (map) {
      map.setAttribute('aria-label', map.getAttribute(lang === 'de' ? 'data-aria-de' : 'data-aria-en'));
    }
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

    // Parliament map: hover/focus/tap a dot to show its name + seat city.
    // Each dot may carry a data-hours attribute (added once available from
    // the FTP server dataset); when present it's shown as an extra line.
    var tooltip = document.getElementById('parl-tooltip');
    var mapWrap = document.querySelector('.parl-map-wrap');
    if (tooltip && mapWrap) {
      var nameEl = tooltip.querySelector('.parl-tooltip-name');
      var parlEl = tooltip.querySelector('.parl-tooltip-parl');
      var activeDot = null;

      var activeTile = null;

      var showTooltip = function (dot, opts) {
        opts = opts || {};
        activeDot = dot;
        dot.classList.add('is-active');
        var code = dot.getAttribute('data-code');
        var statePath = document.querySelector('.state-path[data-code="' + code + '"]');
        if (statePath) statePath.classList.add('is-active');
        var tile = document.querySelector('.collage-tile[data-code="' + code + '"]') ||
                   (dot.classList.contains('parl-dot--bundestag') ? document.querySelector('.collage-tile[data-code="de"]') : null);
        if (tile) {
          tile.classList.add('is-active');
          activeTile = tile;
          // Center it in the collage row — but only when triggered from the
          // map side. Re-centering a tile the user is already hovering
          // directly would shift it out from under their cursor.
          if (opts.scrollCollage !== false) {
            tile.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
        var lang = currentLang();
        var name = dot.getAttribute(lang === 'de' ? 'data-name-de' : 'data-name-en');
        var city = dot.getAttribute(lang === 'de' ? 'data-city-de' : 'data-city-en');
        var parl = dot.getAttribute(lang === 'de' ? 'data-parl-de' : 'data-parl-en');
        var hours = dot.getAttribute('data-hours');
        nameEl.textContent = name + ' — ' + city;
        parlEl.textContent = hours ? parl + ' · ' + hours + (lang === 'de' ? ' Std. im Datensatz' : ' hrs in dataset') : parl;

        var wrapRect = mapWrap.getBoundingClientRect();
        var dotRect = dot.getBoundingClientRect();
        var x = dotRect.left + dotRect.width / 2 - wrapRect.left;
        var y = dotRect.top - wrapRect.top;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.hidden = false;
      };

      var hideTooltip = function () {
        if (activeDot) {
          activeDot.classList.remove('is-active');
          var statePath = document.querySelector('.state-path[data-code="' + activeDot.getAttribute('data-code') + '"]');
          if (statePath) statePath.classList.remove('is-active');
        }
        if (activeTile) activeTile.classList.remove('is-active');
        activeDot = null;
        activeTile = null;
        tooltip.hidden = true;
      };

      document.querySelectorAll('.parl-dot').forEach(function (dot) {
        dot.addEventListener('mouseenter', function () { showTooltip(dot); });
        dot.addEventListener('mouseleave', hideTooltip);
        dot.addEventListener('focus', function () { showTooltip(dot); });
        dot.addEventListener('blur', hideTooltip);
        dot.addEventListener('click', function (e) {
          e.preventDefault();
          if (activeDot === dot) { hideTooltip(); } else { showTooltip(dot); }
        });
      });

      // Hovering the state shape itself (a much bigger target than the dot)
      // shows the same tooltip for that parliament.
      document.querySelectorAll('.state-path').forEach(function (path) {
        var matchingDot = document.querySelector('.parl-dot[data-code="' + path.getAttribute('data-code') + '"]');
        if (!matchingDot) return;
        path.addEventListener('mouseenter', function () { showTooltip(matchingDot); });
        path.addEventListener('mouseleave', hideTooltip);
        path.addEventListener('click', function (e) {
          e.preventDefault();
          if (activeDot === matchingDot) { hideTooltip(); } else { showTooltip(matchingDot); }
        });
      });

      // Hovering a collage photo highlights the matching dot/state on the map.
      document.querySelectorAll('.collage-tile').forEach(function (tile) {
        var code = tile.getAttribute('data-code');
        var matchingDot = document.querySelector('.parl-dot[data-code="' + code + '"]') ||
                           (code === 'de' ? document.querySelector('.parl-dot--bundestag') : null);
        if (!matchingDot) return;
        tile.addEventListener('mouseenter', function () { showTooltip(matchingDot, { scrollCollage: false }); });
        tile.addEventListener('mouseleave', hideTooltip);
      });
    }

    // Collage row: shuffle tile order on every load, so it's a different mix each visit.
    var collageRow = document.querySelector('.collage-row');
    if (collageRow) {
      var tiles = Array.prototype.slice.call(collageRow.children);
      for (var i = tiles.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = tiles[i]; tiles[i] = tiles[j]; tiles[j] = tmp;
      }
      tiles.forEach(function (tile) { collageRow.appendChild(tile); });
    }

    // Hero features toggle: animated expand/collapse (hidden by default).
    var featuresBtn = document.getElementById('features-toggle-btn');
    var featuresPanel = document.getElementById('hero-features-panel');
    if (featuresBtn && featuresPanel) {
      featuresBtn.addEventListener('click', function () {
        var isOpen = featuresPanel.classList.contains('is-open');
        if (isOpen) {
          featuresPanel.style.maxHeight = featuresPanel.scrollHeight + 'px';
          // force reflow so the browser registers the start height before animating to 0
          featuresPanel.offsetHeight; // eslint-disable-line no-unused-expressions
          featuresPanel.style.maxHeight = '0px';
          featuresPanel.classList.remove('is-open');
          featuresBtn.setAttribute('aria-expanded', 'false');
        } else {
          featuresPanel.hidden = false;
          featuresPanel.style.maxHeight = '0px';
          featuresPanel.offsetHeight; // eslint-disable-line no-unused-expressions
          featuresPanel.classList.add('is-open');
          featuresPanel.style.maxHeight = featuresPanel.scrollHeight + 'px';
          featuresBtn.setAttribute('aria-expanded', 'true');
        }
      });
      featuresPanel.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'max-height') return;
        if (featuresPanel.classList.contains('is-open')) {
          featuresPanel.style.maxHeight = 'none'; // let it breathe if content reflows later
        } else {
          featuresPanel.hidden = true;
        }
      });
    }

    // Ambient idle behaviour for the collage row: slowly auto-scroll back
    // and forth so it's obvious there's more to see. No highlighting —
    // just movement. Pauses the moment the user hovers/focuses/touches the
    // row, resumes a little after they leave.
    var collageWrap = document.querySelector('.collage-row-wrap');
    var collageScroller = document.querySelector('.collage-row');
    var reduceMotionMQ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (collageWrap && collageScroller && !(reduceMotionMQ && reduceMotionMQ.matches)) {
      var idlePaused = false;
      var scrollDir = 1;

      var tickScroll = function () {
        if (idlePaused) return;
        var maxScroll = collageScroller.scrollWidth - collageScroller.clientWidth;
        if (maxScroll <= 0) return;
        collageScroller.scrollLeft += 0.9 * scrollDir;
        if (collageScroller.scrollLeft >= maxScroll) scrollDir = -1;
        else if (collageScroller.scrollLeft <= 0) scrollDir = 1;
      };

      var pauseIdle = function () { idlePaused = true; };
      var resumeIdleSoon = function () {
        clearTimeout(resumeIdleSoon._t);
        resumeIdleSoon._t = setTimeout(function () { idlePaused = false; }, 1200);
      };

      collageWrap.addEventListener('mouseenter', pauseIdle);
      collageWrap.addEventListener('mouseleave', resumeIdleSoon);
      collageWrap.addEventListener('touchstart', pauseIdle, { passive: true });
      collageWrap.addEventListener('focusin', pauseIdle);
      collageWrap.addEventListener('focusout', resumeIdleSoon);

      // Also pause while hovering the map itself — otherwise the ambient
      // ticker fights the "center this tile" scroll that a map hover triggers.
      if (mapWrap) {
        mapWrap.addEventListener('mouseenter', pauseIdle);
        mapWrap.addEventListener('mouseleave', resumeIdleSoon);
        mapWrap.addEventListener('focusin', pauseIdle);
        mapWrap.addEventListener('focusout', resumeIdleSoon);
      }

      setInterval(tickScroll, 30);
    }
  });
})();
