/* ============================================================
   BriNora — router + view transitions
   Plain JS, no framework, no build step.
   ============================================================ */
(function () {
  'use strict';

  var VIEWS = ['home', 'states', 'system', 'research', 'about', 'pricing', 'paths'];

  var TITLES = {
    home:     'BriNora — A continuous state of calm',
    states:   'States — BriNora',
    system:   'System — BriNora',
    research: 'Research — BriNora',
    about:    'About — BriNora',
    pricing:  'Pricing — BriNora',
    paths:    'Paths — BriNora'
  };

  // Keep in sync with --t-dur in styles.css (480ms).
  var DURATION = 480;

  var port = document.getElementById('view');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = {};
  VIEWS.forEach(function (id) { sections[id] = document.getElementById(id); });

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = null;
  var animating = false;

  // Returns a valid view id, or null for unknown hashes (e.g. the skip link).
  function routeFromHash() {
    var raw = (location.hash || '').replace('#', '').trim().toLowerCase();
    if (raw === '') return 'home';
    return VIEWS.indexOf(raw) !== -1 ? raw : null;
  }

  function setActiveNav(id) {
    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // Swap which section is visible (no animation).
  function applyView(id) {
    VIEWS.forEach(function (v) { sections[v].hidden = (v !== id); });
    current = id;
    setActiveNav(id);
    document.title = TITLES[id] || 'BriNora';
    port.scrollTop = 0;
  }

  function playEnter() {
    port.classList.add('is-entering');
    window.setTimeout(function () { port.classList.remove('is-entering'); }, DURATION);
  }

  function go(id) {
    if (!id || id === current) return;

    // Honour reduced-motion: swap instantly, no blur/fade.
    if (reduceMQ.matches) { applyView(id); return; }

    // A transition is mid-flight; it re-checks the hash when it finishes.
    if (animating) return;
    animating = true;

    var swapped = false;

    function finish() {
      if (swapped) return;
      swapped = true;
      port.removeEventListener('transitionend', onLeaveEnd);

      applyView(id);
      port.classList.remove('is-leaving'); // container fades + de-blurs back in
      playEnter();

      window.setTimeout(function () {
        animating = false;
        var next = routeFromHash();        // follow anything tapped mid-transition
        if (next && next !== current) go(next);
      }, DURATION);
    }

    function onLeaveEnd(e) {
      if (e.target === port && e.propertyName === 'opacity') finish();
    }

    port.addEventListener('transitionend', onLeaveEnd);
    port.classList.add('is-leaving');           // fade + blur out
    window.setTimeout(finish, DURATION + 90);    // safety net if transitionend misses
  }

  function onRoute() {
    var id = routeFromHash();
    if (id) go(id); // ignore unknown hashes so the skip link doesn't reroute
  }

  // ---- Initial render ----
  var start = routeFromHash() || 'home';
  applyView(start);
  if (!reduceMQ.matches) playEnter();

  // Reflect a default hash so refreshes land in the same place.
  if (!location.hash) {
    try { history.replaceState(null, '', '#home'); } catch (e) {}
  }

  window.addEventListener('hashchange', onRoute);
})();
