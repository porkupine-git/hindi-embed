/**
 * MASTER JW PLAYER 8 EMBED ENGINE FOR EMBED.ANIXOHINDI.CC
 * Authentic, ultra-fast cinema JW Player 8 embed.
 * Features:
 * - 1080p Full HD Hindi Dub direct stream from Telegram MTProto (Range 206)
 * - 10s Rewind & 10s Forward controls
 * - Speed selector [0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x]
 * - Web Audio API Volume Booster (+150%, +300%)
 * - Anti-Sandbox security shield
 * - Auto-Play (with muted fallback) & Auto-Next on video finish
 * - Comprehensive parent postMessage bridge
 * - Keyboard shortcuts (Space/K, Arrows, F, M)
 */

import { volumeBoosterScript } from './volumeBooster.js';

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(str) {
    if (str == null) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

function scrambleUrl(str, key) {
    if (!str) return '';
    let res = '';
    for (let i = 0; i < str.length; i++) {
        res += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(res, 'binary').toString('base64');
}

export function renderJwPlayerHtml({
    title = "",
    episode = 1,
    streamUrl = "",
    nextEpUrl = null,
    poster = "",
    autoPlay = true,
    anilistId = null,
    malId = null,
    hindiId = null
}) {
    const sessionKey = 'anx_' + Math.random().toString(36).substring(2, 10);
    const scrambledUrl = scrambleUrl(streamUrl, sessionKey);
    const pageTitle = escapeHtml(title ? `${title} - Episode ${episode} (Hindi Dub) | Anixo Hindi` : `Episode ${episode} (Hindi Dub) | Anixo Hindi`);

    // Canonical & Standalone Redirect Target on Official Main Domain
    const animeRef = anilistId || hindiId || malId || '';
    const canonicalWatchUrl = animeRef ? `https://anixohindi.cc/watch.php?anime=${encodeURIComponent(animeRef)}&ep=${encodeURIComponent(episode)}` : 'https://anixohindi.cc/';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${pageTitle}</title>
    
    <!-- Search Engine Indexing Controls: Prevent embed subdomain from ranking in Google / Bing -->
    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
    <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
    <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet">
    <link rel="canonical" href="${escapeHtml(canonicalWatchUrl)}">

    <!-- Standalone Direct Access Shield: Redirect direct visitors (e.g. from Google Search) to main site -->
    <script>
        (function() {
            try {
                if (window.self === window.top) {
                    var qs = window.location.search || '';
                    if (qs.indexOf('standalone=1') === -1 && qs.indexOf('debug=1') === -1) {
                        var target = '${escapeJs(canonicalWatchUrl)}';
                        if (target) {
                            window.location.replace(target);
                        }
                    }
                }
            } catch(e) {}
        })();
    </script>
    
    <!-- JW Player 8 Preload -->
    <link rel="preload" href="/js/jwplayer/jwplayer.core.controls.js" as="script">
    <link rel="preload" href="/js/jwplayer/jwplayer.js" as="script">
    
    <!-- Google Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- Anti-Sandbox Shield -->
    <script>
        (function() {
            var isSandboxRestricted = false;
            window.__isSandboxRestricted = false;

            function isEmbeddedFrame() {
                try { return window.top !== window; } catch(e) { return true; }
            }

            function showSandboxOverlay() {
                var o = document.getElementById('vc-sandbox-overlay');
                if (o) {
                    o.classList.remove('vc-hidden');
                    o.style.setProperty('display', 'flex', 'important');
                    o.style.setProperty('visibility', 'visible', 'important');
                    o.style.setProperty('opacity', '1', 'important');
                    o.style.setProperty('z-index', '2147483647', 'important');
                }
            }

            function triggerSandboxBlock(reason) {
                if (isSandboxRestricted) {
                    showSandboxOverlay();
                    return;
                }
                isSandboxRestricted = true;
                window.__isSandboxRestricted = true;
                console.warn('[JWPlayer Security] Sandbox restriction detected:', reason);

                try {
                    if (window.__jwInstance && typeof window.__jwInstance.stop === 'function') {
                        window.__jwInstance.stop();
                    } else if (typeof jwplayer === 'function') {
                        var p = jwplayer('jwplayer-container');
                        if (p && typeof p.stop === 'function') p.stop();
                    }
                } catch(e) {}

                var l = document.getElementById('loading-overlay');
                if (l) l.style.display = 'none';

                showSandboxOverlay();

                try {
                    window.parent.postMessage({ event: 'sandbox_blocked', type: 'sandbox_blocked', reason: reason, source: 'jwplayer' }, '*');
                } catch(e) {}
            }
            window.__triggerSandboxBlock = triggerSandboxBlock;

            function initSandboxDetector() {
                if (!isEmbeddedFrame()) return;
                try {
                    if (window.frameElement && window.frameElement.hasAttribute('sandbox')) {
                        var sb = window.frameElement.getAttribute('sandbox');
                        if (sb !== null) {
                            var tokens = sb.toLowerCase().split(/\\s+/);
                            var req = ['allow-scripts', 'allow-same-origin', 'allow-popups'];
                            var ok = req.every(function(t) { return tokens.indexOf(t) !== -1; });
                            if (!ok) {
                                triggerSandboxBlock('frame-has-sandbox');
                                return;
                            }
                        }
                    }
                } catch(e) {}

                try {
                    if (window.origin === 'null' || (document && document.origin === 'null') || (window.location && window.location.origin === 'null')) {
                        triggerSandboxBlock('opaque-origin');
                        return;
                    }
                } catch(e) {}

                try {
                    var k = '__anx_sb__';
                    window.localStorage.setItem(k, '1');
                    window.localStorage.removeItem(k);
                } catch(e) {
                    if (e && (e.name === 'SecurityError' || String(e.message).toLowerCase().indexOf('access is denied') !== -1)) {
                        triggerSandboxBlock('storage-blocked');
                        return;
                    }
                }
            }
            initSandboxDetector();

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    if (isSandboxRestricted || window.__isSandboxRestricted) {
                        showSandboxOverlay();
                    }
                });
            }
        })();
    </script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000000;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            color: #ffffff;
        }

        .anixo-player-wrapper {
            width: 100% !important;
            height: 100% !important;
            position: relative;
            background: #000000;
        }

        #jwplayer-container {
            width: 100% !important;
            height: 100% !important;
        }

        .jwplayer {
            width: 100% !important;
            height: 100% !important;
        }

        .jw-rightclick {
            display: none !important;
        }

        /* Hide default rewind button in center/left to avoid duplicates */
        .jw-controlbar .jw-icon-rewind,
        .jw-display-icon-rewind {
            display: none !important;
        }

        /* Cinema Transparent Controlbar */
        .jw-controls-backdrop {
            display: none !important;
            background: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }

        .jw-controlbar,
        .jw-controlbar-left,
        .jw-controlbar-right,
        .jw-controlbar-center,
        .jw-background-color {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            box-shadow: none !important;
        }

        /* Solid White Controls with Micro-Interactions */
        .jw-controlbar .jw-icon,
        .jw-controlbar .jw-button-color {
            color: #ffffff !important;
            fill: #ffffff !important;
            opacity: 0.9;
            filter: none !important;
            transition: opacity 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }

        .jw-controlbar .jw-svg-icon,
        .jw-controlbar svg {
            color: #ffffff !important;
            fill: #ffffff !important;
            filter: none !important;
            transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .jw-controlbar .jw-icon:hover,
        .jw-controlbar .jw-button-color:hover {
            opacity: 1 !important;
        }

        .jw-controlbar .jw-icon:hover .jw-svg-icon,
        .jw-controlbar .jw-icon:hover svg,
        .jw-controlbar .jw-button-color:hover svg {
            transform: scale(1.15);
            opacity: 1 !important;
        }

        /* 10s Rewind & Forward Button Sizing */
        [button="custom-rewind-10"] .jw-svg-icon,
        [button="custom-forward-10"] .jw-svg-icon,
        .jw-svg-icon-rewind,
        .jw-svg-icon-forward {
            width: 26px !important;
            height: 26px !important;
            transition: transform 0.15s ease, opacity 0.15s ease;
        }

        [button="custom-rewind-10"]:hover .jw-svg-icon,
        [button="custom-forward-10"]:hover .jw-svg-icon {
            transform: scale(1.18) !important;
        }

        /* Seekbar Emerald Accent (#10b981) */
        .jw-slider-time .jw-progress {
            background-color: #10b981 !important;
            opacity: 1 !important;
        }

        .jw-slider-time .jw-knob {
            background-color: #ffffff !important;
            border-radius: 50% !important;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.8) !important;
            opacity: 1 !important;
        }

        .jw-slider-time .jw-buffer {
            background-color: rgba(255, 255, 255, 0.3) !important;
            opacity: 1 !important;
        }

        .jw-slider-time .jw-rail {
            background-color: rgba(255, 255, 255, 0.18) !important;
            opacity: 1 !important;
        }



        /* Loading Spinner Overlay */
        .loading-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(4px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            z-index: 500;
            transition: opacity 0.25s ease;
        }

        .loading-spinner {
            width: 44px;
            height: 44px;
            border: 3.5px solid rgba(16, 185, 129, 0.2);
            border-top-color: #10b981;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        .loading-text {
            font-size: 13.5px;
            font-weight: 600;
            color: #e4e4e7;
            letter-spacing: 0.3px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Clean Error Overlay */
        .error-overlay {
            position: absolute;
            inset: 0;
            background: #09090b;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 600;
            padding: 20px;
        }

        .error-card {
            background: #18181b;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 28px 24px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
        }

        .error-title {
            font-size: 17px;
            font-weight: 700;
            color: #ef4444;
            margin-bottom: 8px;
        }

        .error-desc {
            font-size: 13.5px;
            color: #a1a1aa;
            line-height: 1.5;
            margin-bottom: 18px;
        }

        .error-btn {
            background: #10b981;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 9px 20px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .error-btn:hover {
            background: #059669;
        }

        /* Next Episode Auto-Countdown Card */
        .next-ep-card {
            position: absolute;
            bottom: 80px;
            right: 24px;
            z-index: 300;
            background: rgba(24, 24, 27, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            padding: 14px 18px;
            display: none;
            align-items: center;
            gap: 14px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
            user-select: none;
            animation: fadeIn 0.3s ease;
        }

        .next-ep-btn {
            background: #10b981;
            color: #fff;
            border: none;
            padding: 7px 14px;
            border-radius: 6px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background 0.15s ease;
        }

        .next-ep-btn:hover {
            background: #059669;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Sandbox Warning Overlay */
        .vc-sandbox-overlay {
            position: absolute !important;
            inset: 0 !important;
            background: #0b0c10 !important;
            z-index: 2147483647 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 24px !important;
            text-align: center !important;
        }
        .vc-sandbox-overlay.vc-hidden {
            display: none !important;
        }
        .vc-sandbox-content {
            max-width: 460px;
            background: #18181b;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 24px 28px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
        }
    </style>
</head>
<body>

<div class="anixo-player-wrapper">


    <!-- Loading Spinner -->
    <div class="loading-overlay" id="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Buffering Hindi Dub Stream...</div>
    </div>

    <!-- Error State Overlay -->
    <div class="error-overlay" id="error-overlay">
        <div class="error-card">
            <div class="error-title">Stream Interrupted</div>
            <div class="error-desc" id="error-desc">Unable to load the Hindi Dub stream from the Telegram gateway. Please retry.</div>
            <button class="error-btn" onclick="window.location.reload()">Retry Stream</button>
        </div>
    </div>

    <!-- Next Episode Countdown Card -->
    ${nextEpUrl ? `
    <div class="next-ep-card" id="next-ep-card">
        <div>
            <div style="font-size:11px;color:#a1a1aa;text-transform:uppercase;font-weight:600;">Next Episode</div>
            <div style="font-size:13.5px;font-weight:700;color:#fff;" id="next-ep-countdown">Starting in 5s...</div>
        </div>
        <button class="next-ep-btn" id="next-ep-btn" onclick="window.location.href='${escapeHtml(nextEpUrl)}'">
            Play Now <i class="fa-solid fa-forward-step"></i>
        </button>
    </div>` : ''}

    <!-- JW Player Main Container -->
    <div id="jwplayer-container"></div>
</div>

<!-- JW Player 8 Self-Hosted Scripts -->
<script src="/js/jwplayer/jwplayer.core.controls.js"></script>
<script src="/js/jwplayer/jwplayer.js"></script>

<script>
(function initJWPlayerApp() {
    if (window.__isSandboxRestricted) {
        console.warn('[JWPlayer] Sandbox active — aborting init');
        return;
    }

    const loadingOverlay = document.getElementById('loading-overlay');
    const errorOverlay = document.getElementById('error-overlay');
    const errorDesc = document.getElementById('error-desc');
    const nextEpCard = document.getElementById('next-ep-card');
    const nextEpCountdown = document.getElementById('next-ep-countdown');

    const _p0 = '${scrambledUrl}';
    const _k0 = '${sessionKey}';
    function _dx(s, k) {
        try {
            var b = atob(s), r = '';
            for (var i = 0; i < b.length; i++) {
                r += String.fromCharCode(b.charCodeAt(i) ^ k.charCodeAt(i % k.length));
            }
            return r;
        } catch(e) {
            return '';
        }
    }
    const streamUrl = _dx(_p0, _k0);
    const nextEpUrl = ${nextEpUrl ? `'${escapeJs(nextEpUrl)}'` : 'null'};
    const autoPlay = ${autoPlay ? 'true' : 'false'};
    const animeTitle = '${escapeJs(title)}';
    const episode = ${parseInt(episode, 10) || 1};

    const rewindSvg = '<svg class="jw-svg-icon jw-svg-icon-rewind" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" focusable="false"><path d="M113.2,131.078a21.589,21.589,0,0,0-17.7-10.6,21.589,21.589,0,0,0-17.7,10.6,44.769,44.769,0,0,0,0,46.3,21.589,21.589,0,0,0,17.7,10.6,21.589,21.589,0,0,0,17.7-10.6,44.769,44.769,0,0,0,0-46.3Zm-17.7,47.2c-7.8,0-14.4-11-14.4-24.1s6.6-24.1,14.4-24.1,14.4,11,14.4,24.1S103.4,178.278,95.5,178.278Zm-43.4,9.7v-51l-4.8,4.8-6.8-6.8,13-13a4.8,4.8,0,0,1,8.2,3.4v62.7l-9.6-.1Zm162-130.2v125.3a4.867,4.867,0,0,1-4.8,4.8H146.6v-19.3h48.2v-96.4H79.1v19.3c0,5.3-3.6,7.2-8,4.3l-41.8-27.9a6.013,6.013,0,0,1-2.7-8,5.887,5.887,0,0,1,2.7-2.7l41.8-27.9c4.4-2.9,8-1,8,4.3v19.3H209.2A4.974,4.974,0,0,1,214.1,57.778Z"></path></svg>';
    const forwardSvg = '<svg class="jw-svg-icon jw-svg-icon-forward" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" focusable="false"><g transform="scale(-1, 1) translate(-240, 0)"><path d="M214.1,57.778v125.3a4.867,4.867,0,0,1-4.8,4.8H146.6v-19.3h48.2v-96.4H79.1v19.3c0,5.3-3.6,7.2-8,4.3l-41.8-27.9a6.013,6.013,0,0,1-2.7-8,5.887,5.887,0,0,1,2.7-2.7l41.8-27.9c4.4-2.9,8-1,8,4.3v19.3H209.2A4.974,4.974,0,0,1,214.1,57.778Z"></path></g><g transform="translate(74, 0)"><path d="M113.2,131.078a21.589,21.589,0,0,0-17.7-10.6,21.589,21.589,0,0,0-17.7,10.6,44.769,44.769,0,0,0,0,46.3,21.589,21.589,0,0,0,17.7,10.6,21.589,21.589,0,0,0,17.7-10.6,44.769,44.769,0,0,0,0-46.3Zm-17.7,47.2c-7.8,0-14.4-11-14.4-24.1s6.6-24.1,14.4-24.1,14.4,11,14.4,24.1S103.4,178.278,95.5,178.278Zm-43.4,9.7v-51l-4.8,4.8-6.8-6.8,13-13a4.8,4.8,0,0,1,8.2,3.4v62.7l-9.6-.1Z"></path></g></svg>';

    const player = jwplayer("jwplayer-container").setup({
        playlist: [{
            title: animeTitle ? (animeTitle + ' - EP ' + episode) : ('Episode ' + episode),
            image: '${escapeJs(poster)}' || undefined,
            sources: [{
                file: streamUrl,
                type: 'mp4',
                label: '1080p FHD (Hindi Dub)',
                default: true
            }]
        }],
        autostart: autoPlay,
        width: "100%",
        height: "100%",
        aspectratio: "16:9",
        stretching: "uniform",
        preload: "auto",
        playbackRateControls: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        displaydescription: false,
        displaytitle: false,
        floating: { mode: "never" },
        cast: {},
        skin: {
            controlbar: {
                background: "transparent",
                icons: "#ffffff",
                iconsActive: "#10b981",
                text: "#ffffff"
            }
        }
    });

    window.__jwInstance = player;

    player.on('ready', function() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        // Add 10s Rewind & Forward buttons to JW Player controlbar
        try {
            player.addButton(forwardSvg, "Forward 10s", function() {
                player.seek(player.getPosition() + 10);
            }, "custom-forward-10");

            player.addButton(rewindSvg, "Rewind 10s", function() {
                player.seek(Math.max(0, player.getPosition() - 10));
            }, "custom-rewind-10");
        } catch(e) {
            console.warn("[JWPlayer] Add button error:", e);
        }

        window.parent.postMessage({
            event: 'ready',
            type: 'ready',
            source: 'jwplayer',
            title: animeTitle,
            episode: episode
        }, '*');
    });

    // Hide buffer spinner on first frame
    player.on('firstFrame', function() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    });

    player.on('buffer', function() {
        // Show subtle loading state if needed
    });

    player.on('play', function() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (nextEpCard) nextEpCard.style.display = 'none';
        window.parent.postMessage({ event: 'play', type: 'play', source: 'jwplayer' }, '*');
    });

    player.on('pause', function() {
        window.parent.postMessage({ event: 'pause', type: 'pause', source: 'jwplayer' }, '*');
    });

    let lastSentTime = 0;
    player.on('time', function(e) {
        const now = Date.now();
        if (now - lastSentTime > 1000) {
            lastSentTime = now;
            window.parent.postMessage({
                event: 'timeupdate',
                type: 'timeupdate',
                currentTime: e.position,
                duration: e.duration,
                percentage: e.duration ? (e.position / e.duration) * 100 : 0,
                source: 'jwplayer'
            }, '*');
        }
    });

    // Auto-Next Episode Handler
    let countdownSec = 5;
    let countdownInterval = null;

    player.on('complete', function() {
        window.parent.postMessage({ event: 'ended', type: 'ended', source: 'jwplayer' }, '*');

        if (nextEpUrl) {
            if (nextEpCard) {
                nextEpCard.style.display = 'flex';
                countdownSec = 5;
                if (nextEpCountdown) nextEpCountdown.textContent = 'Starting in ' + countdownSec + 's...';
                
                if (countdownInterval) clearInterval(countdownInterval);
                countdownInterval = setInterval(function() {
                    countdownSec--;
                    if (countdownSec <= 0) {
                        clearInterval(countdownInterval);
                        window.location.href = nextEpUrl;
                    } else {
                        if (nextEpCountdown) nextEpCountdown.textContent = 'Starting in ' + countdownSec + 's...';
                    }
                }, 1000);
            } else {
                window.location.href = nextEpUrl;
            }
        }
    });

    player.on('error', function(err) {
        console.error('[JWPlayer] Playback Error:', err);
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (errorDesc && err && err.message) errorDesc.textContent = err.message;
        if (errorOverlay) errorOverlay.style.display = 'flex';

        window.parent.postMessage({
            event: 'error',
            type: 'error',
            message: err ? err.message : 'Playback error',
            source: 'jwplayer'
        }, '*');
    });

    // Anti-Theft: Disable context menu (right click) inside the player
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Anti-DevTools: Block common inspection keyboard shortcuts
    window.addEventListener('keydown', function(e) {
        if (
            e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || // Ctrl+Shift+I/J/C
            (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83)) // Ctrl+U / Ctrl+S
        ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);

    // Keyboard Shortcuts
    document.addEventListener('keydown', function(e) {
        const key = e.key.toLowerCase();
        if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) return;

        if (key === ' ' || key === 'k') {
            e.preventDefault();
            player.getState() === 'playing' ? player.pause() : player.play();
        } else if (key === 'arrowleft' || key === 'j') {
            e.preventDefault();
            player.seek(Math.max(0, player.getPosition() - 10));
        } else if (key === 'arrowright' || key === 'l') {
            e.preventDefault();
            player.seek(player.getPosition() + 10);
        } else if (key === 'arrowup') {
            e.preventDefault();
            player.setVolume(Math.min(100, player.getVolume() + 10));
        } else if (key === 'arrowdown') {
            e.preventDefault();
            player.setVolume(Math.max(0, player.getVolume() - 10));
        } else if (key === 'f') {
            e.preventDefault();
            player.setFullscreen(!player.getFullscreen());
        } else if (key === 'm') {
            e.preventDefault();
            player.setMute(!player.getMute());
        }
    });

    // Parent postMessage Command Listener
    window.addEventListener('message', function(event) {
        if (!event.data) return;
        const d = event.data;
        const action = d.event || d.action || d.type;

        if (action === 'play') player.play();
        else if (action === 'pause') player.pause();
        else if (action === 'togglePlay') player.getState() === 'playing' ? player.pause() : player.play();
        else if (action === 'seek' && typeof d.time === 'number') player.seek(d.time);
        else if (action === 'skip') player.seek(Math.max(0, player.getPosition() + (d.amount || 10)));
        else if (action === 'setVolume' && typeof d.volume === 'number') player.setVolume(d.volume);
        else if (action === 'mute') player.setMute(typeof d.mute === 'boolean' ? d.mute : true);
        else if (action === 'setPlaybackRate' && typeof d.rate === 'number') player.setPlaybackRate(d.rate);
    });
})();
</script>

<!-- Volume Booster Script -->
<script>
${volumeBoosterScript}
</script>

</body>
</html>`;
}
