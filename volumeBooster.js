/**
 * Master Volume Booster Module for JW Player 8
 * Web Audio API GainNode up to +300% boost with persistent localStorage memory.
 */
export const volumeBoosterScript = `
(function () {
  "use strict";

  // iPhone / iPad: Web Audio cannot boost native media elements - skip
  function isAppleTouchDevice() {
    try {
      var ua = navigator.userAgent || "";
      if (/iPhone|iPod|iPad/i.test(ua)) return true;
      if (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1) {
        return true;
      }
    } catch (e) {}
    return false;
  }
  if (isAppleTouchDevice()) return;

  var PLAYER = '#jwplayer-container';
  var LS_KEY = 'anixo_boost_amt';

  if (window.__anixoBoosterInit) return;
  window.__anixoBoosterInit = true;

  var BOOST_ICON =
    '<path d="M116.5,42.8v154.4c0,2.8-1.7,3.6-3.8,1.7l-54.1-48H29c-2.8,0-5.2-2.3-5.2-5.2V94.3c0-2.8,2.3-5.2,5.2-5.2h29.6l54.1-48C114.8,39.2,116.5,39.9,116.5,42.8z"></path>' +
    '<path d="M136.2,160v-20c11.1,0,20-8.9,20-20s-8.9-20-20-20V80c22.1,0,40,17.9,40,40S158.3,160,136.2,160z"></path>' +
    '<path d="M216.2,120c0-44.2-35.8-80-80-80v20c33.1,0,60,26.9,60,60s-26.9,60-60,60v20C180.4,199.9,216.1,164.1,216.2,120z"></path>';

  var boostGen = 0;
  var boostTimers = [];

  function cancelBoostTimers() {
    for (var i = 0; i < boostTimers.length; i++) clearTimeout(boostTimers[i]);
    boostTimers = [];
    boostGen++;
  }

  function savedAmt() {
    var p = parseInt(localStorage.getItem(LS_KEY), 10);
    return isNaN(p) ? 0 : Math.max(0, Math.min(300, p));
  }

  function formatBoostLabel(amt) {
    return amt <= 0 ? 'Off' : ('+' + amt + '%');
  }

  function syncUi(amt) {
    var r = document.querySelector('[data-mpb-range]'), v = document.querySelector('[data-mpb-val]');
    if (r && +r.value !== amt) r.value = amt;
    if (v) v.textContent = formatBoostLabel(amt);
  }

  function gainFromAmt(amt) {
    return 1 + (Math.max(0, amt) / 100);
  }

  function ensureBoosterApi() {
    if (window.__anixoBooster && window.__anixoBooster.set) return window.__anixoBooster;

    window.__anixoBooster = {
      ctx: null,
      gain: null,
      amt: savedAmt(),
      wired: false,
      set: function (amt, noStore) {
        amt = Math.max(0, Math.min(300, +amt || 0));
        this.amt = amt;
        this.pct = amt;
        if (!noStore) {
          try { localStorage.setItem(LS_KEY, amt); } catch (e) {}
        }
        syncUi(amt);

        if (amt <= 0) {
          if (this.wired && this.gain) this.gain.gain.value = 1;
          return true;
        }

        if (!this.wired && !wireAudioGraph(this)) {
          return false;
        }
        if (this.gain) this.gain.gain.value = gainFromAmt(amt);
        return true;
      }
    };
    return window.__anixoBooster;
  }

  function wireAudioGraph(B) {
    if (B.wired && B.gain) return true;
    var host = document.querySelector(PLAYER) || document.querySelector('.jwplayer') || document.body;
    var video = host.querySelector('video') || document.querySelector('video');
    if (!video) return false;

    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    var ctx, src;
    try {
      ctx = new AC();
      src = ctx.createMediaElementSource(video);
    } catch (e) {
      return false;
    }
    var gain = ctx.createGain();
    gain.gain.value = gainFromAmt(B.amt || 0);
    src.connect(gain).connect(ctx.destination);

    var resume = function () { if (ctx.state === 'suspended') ctx.resume(); };
    document.addEventListener('click', resume, true);
    video.addEventListener('play', resume);
    resume();

    B.ctx = ctx;
    B.gain = gain;
    B.wired = true;
    return true;
  }

  function applySavedBoostIfNeeded() {
    var B = ensureBoosterApi();
    if (B.amt <= 0 || B.wired) return;
    var host = document.querySelector(PLAYER) || document.querySelector('.jwplayer') || document.body;
    var video = host.querySelector('video') || document.querySelector('video');
    if (!video) return;
    B.set(B.amt, true);
  }

  function menuEl() {
    return document.querySelector(PLAYER + ' .jw-settings-menu') || document.querySelector('.jw-settings-menu');
  }

  function isBoostShowing(menu) {
    menu = menu || menuEl();
    if (!menu) return false;
    var sub = menu.querySelector('[data-mpb-sub]');
    if (!sub) return false;
    if (sub.style.display === 'none') return false;
    return sub.classList.contains('jw-settings-submenu-active') || sub.style.display === 'block';
  }

  function hideBoost(menu) {
    menu = menu || menuEl();
    if (!menu) return;
    var sub = menu.querySelector('[data-mpb-sub]');
    var btn = menu.querySelector('[data-mpb-btn]');
    if (sub) {
      sub.style.display = 'none';
      sub.classList.remove('jw-settings-submenu-active');
      sub.setAttribute('aria-expanded', 'false');
    }
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function clearNativeInlineDisplay(menu) {
    if (!menu) return;
    menu.querySelectorAll('.jw-settings-submenu:not([data-mpb-sub])').forEach(function (s) {
      if (s.style && s.style.display) s.style.display = '';
    });
  }

  function syncBoostAwayFromNative() {
    var menu = menuEl();
    if (!menu || !isBoostShowing(menu)) return;

    var nativeActive = menu.querySelector('.jw-settings-submenu-active:not([data-mpb-sub])');
    var controls = document.querySelector(PLAYER + ' .jw-controls') || document.querySelector('.jw-controls');
    var settingsOpen = controls && controls.classList.contains('jw-settings-open');

    if (nativeActive || !settingsOpen) {
      cancelBoostTimers();
      hideBoost(menu);
      clearNativeInlineDisplay(menu);
    }
  }

  function openNativeSubmenu(menu, row, jwTab) {
    if (!menu || !jwTab) return;
    var id = jwTab.getAttribute('aria-controls');
    if (!id) return;
    var target = document.getElementById(id);
    if (!target || target.hasAttribute('data-mpb-sub')) return;

    hideBoost(menu);
    clearNativeInlineDisplay(menu);

    menu.querySelectorAll('.jw-settings-submenu:not([data-mpb-sub])').forEach(function (s) {
      s.classList.remove('jw-settings-submenu-active');
      s.setAttribute('aria-expanded', 'false');
    });
    if (row) {
      row.querySelectorAll('[aria-controls]').forEach(function (t) {
        if (t !== jwTab && !t.hasAttribute('data-mpb-btn')) {
          t.setAttribute('aria-expanded', 'false');
        }
      });
    }

    target.classList.add('jw-settings-submenu-active');
    target.setAttribute('aria-expanded', 'true');
    jwTab.setAttribute('aria-expanded', 'true');
  }

  function inject() {
    var B = ensureBoosterApi();
    applySavedBoostIfNeeded();

    var menu = menuEl();
    if (!menu) return;
    var row = menu.querySelector('.jw-settings-topbar-buttons');
    if (!row) return;
    if (row.querySelector('[data-mpb-btn]')) return;

    var old = menu.querySelector('[data-mpb-sub]');
    if (old) old.remove();

    var protoTab = row.querySelector('[aria-controls]');
    if (!protoTab) return;
    var closeBtn = row.querySelector('.jw-settings-close');
    var subId = (menu.id || 'jwplayer-container-settings-menu').replace(/menu$/, 'submenu-boost');

    var tab = protoTab.cloneNode(true);
    tab.setAttribute('data-mpb-btn', '1');
    tab.setAttribute('class', 'jw-icon jw-icon-inline jw-button-color jw-reset jw-settings-boost jw-submenu-boost');
    tab.setAttribute('aria-controls', subId);
    tab.setAttribute('aria-label', 'Volume Boost');
    tab.setAttribute('name', 'boost');
    tab.setAttribute('aria-expanded', 'false');
    var svg = tab.querySelector('svg');
    if (svg) { svg.setAttribute('class', 'jw-svg-icon'); svg.innerHTML = BOOST_ICON; }
    var tip = tab.querySelector('.jw-tooltip .jw-text');
    if (tip) tip.textContent = 'Volume Boost';

    var sub = document.createElement('div');
    sub.id = subId;
    sub.setAttribute('data-mpb-sub', '1');
    sub.setAttribute('role', 'menu');
    sub.setAttribute('aria-label', 'Volume Boost');
    sub.setAttribute('aria-expanded', 'false');
    sub.className = 'jw-reset jw-settings-submenu jw-settings-submenu-boost';
    sub.style.display = 'none';
    sub.innerHTML =
      '<div class="jw-reset jw-settings-submenu-items" style="padding:14px 18px;min-width:210px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;color:#fff;font:14px system-ui,Arial;margin-bottom:12px">' +
          '<span style="font-weight:600">Volume Boost</span><b data-mpb-val style="color:#fff;font-weight:700">' + formatBoostLabel(B.amt) + '</b>' +
        '</div>' +
        '<input data-mpb-range type="range" min="0" max="300" step="5" value="' + B.amt + '" style="width:100%;accent-color:#10b981;cursor:pointer">' +
        '<div style="display:flex;justify-content:space-between;color:#a1a1aa;font:11px system-ui;margin-top:6px;font-weight:500"><span>Off</span><span>+150%</span><span>+300%</span></div>' +
      '</div>';

    if (closeBtn) row.insertBefore(tab, closeBtn); else row.appendChild(tab);
    menu.appendChild(sub);

    var range = sub.querySelector('[data-mpb-range]');
    ['input', 'change'].forEach(function (ev) {
      range.addEventListener(ev, function (e) {
        e.stopPropagation();
        B.set(+range.value);
      });
    });
    ['click', 'mousedown', 'pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
      range.addEventListener(ev, function (e) { e.stopPropagation(); });
    });

    function showBoost() {
      menu.querySelectorAll('.jw-settings-submenu:not([data-mpb-sub])').forEach(function (s) {
        s.classList.remove('jw-settings-submenu-active');
        s.setAttribute('aria-expanded', 'false');
        if (s.style && s.style.display) s.style.display = '';
      });
      row.querySelectorAll('[aria-controls]').forEach(function (t) {
        if (t !== tab) t.setAttribute('aria-expanded', 'false');
      });
      sub.style.display = 'block';
      sub.classList.add('jw-settings-submenu-active');
      sub.setAttribute('aria-expanded', 'true');
      tab.setAttribute('aria-expanded', 'true');
      var back = menu.querySelector('.jw-settings-back');
      if (back) back.style.display = 'none';
      syncUi(B.amt);
    }

    tab.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      cancelBoostTimers();
      var gen = boostGen;
      function safeShow() {
        if (gen !== boostGen) return;
        showBoost();
      }
      safeShow();
      boostTimers.push(setTimeout(safeShow, 0));
      boostTimers.push(setTimeout(safeShow, 50));
    });
    tab.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        cancelBoostTimers();
        showBoost();
      }
    });

    row.addEventListener('click', function (e) {
      if (tab.contains(e.target)) return;
      var jwTab = e.target && e.target.closest ? e.target.closest('[aria-controls]') : null;
      if (!jwTab || jwTab.hasAttribute('data-mpb-btn')) return;

      var wasBoost = isBoostShowing(menu);
      cancelBoostTimers();
      hideBoost(menu);
      clearNativeInlineDisplay(menu);
      if (!wasBoost) return;

      function ensure() { openNativeSubmenu(menu, row, jwTab); }
      setTimeout(ensure, 0);
      setTimeout(ensure, 40);
    }, true);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('[data-mpb-btn]') || t.closest('[data-mpb-sub]')) return;

    var leaveBoost =
      t.closest('.jw-icon-cc') ||
      t.closest('.jw-icon-settings') ||
      t.closest('.jw-settings-close') ||
      t.closest('[button="closed-captions"]') ||
      t.closest('.jw-button-container .jw-icon-cc');

    if (!leaveBoost) return;

    cancelBoostTimers();
    var menu = menuEl();
    hideBoost(menu);
    clearNativeInlineDisplay(menu);
    setTimeout(syncBoostAwayFromNative, 0);
    setTimeout(syncBoostAwayFromNative, 50);
    setTimeout(syncBoostAwayFromNative, 120);
  }, true);

  function start() {
    inject();
    var host = document.querySelector(PLAYER) || document.querySelector('.jwplayer') || document.body;
    new MutationObserver(function () {
      inject();
      syncBoostAwayFromNative();
    }).observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'aria-expanded'] });
    setInterval(function () {
      inject();
      syncBoostAwayFromNative();
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
`;
