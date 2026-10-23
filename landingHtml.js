/**
 * ANIXO HINDI DEVELOPER PLATFORM & PERSONAL STUDIO
 * Password-protected private console for testing, streaming, and generating iframe embeds.
 * Obsidian & Emerald Theme matching Anixo Hindi Brand.
 */

export function renderLandingHtml(baseUrl = "") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anixo Hindi — Private Studio & Embed Console</title>
    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
    <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <style>
        :root {
            --bg: #09090b;
            --bg-elevated: #111113;
            --card-bg: #141417;
            --card-border: rgba(255, 255, 255, 0.08);
            --card-border-hover: rgba(16, 185, 129, 0.4);
            --input-bg: #18181c;
            --input-border: rgba(255, 255, 255, 0.1);

            --accent: #10b981;
            --accent-hover: #059669;
            --accent-light: #34d399;
            --accent-tint: rgba(16, 185, 129, 0.12);

            --text-main: #f4f4f5;
            --text-muted: #a1a1aa;
            --text-subtle: #71717a;

            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 14px;
            --radius-xl: 18px;
            --radius-full: 9999px;

            --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; background: var(--bg); color: var(--text-main); font-family: var(--font-sans); }
        body { min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; background: var(--bg); }

        /* ── Password Lock Gate Modal with Frieren Anime Background ── */
        .lock-overlay {
            position: fixed; inset: 0; z-index: 9999;
            background: linear-gradient(180deg, rgba(9, 9, 11, 0.6) 0%, rgba(9, 9, 11, 0.85) 100%),
                        url('/img/frieren_bg.jpg') center center / cover no-repeat;
            display: flex; align-items: center; justify-content: center;
            padding: 20px; transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .lock-overlay.unlocked { opacity: 0; visibility: hidden; pointer-events: none; }
        .lock-card {
            background: rgba(15, 15, 18, 0.82);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: var(--radius-lg); padding: 32px 28px; max-width: 360px; width: 100%;
            text-align: center;
            animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .lock-brand { margin-bottom: 22px; text-align: center; }
        .lock-title { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; letter-spacing: -0.02em; }
        .lock-desc { font-size: 13px; color: var(--text-muted); line-height: 1.4; }
        .lock-input-group { position: relative; margin-bottom: 14px; }
        .lock-input {
            width: 100%; height: 44px; background: rgba(24, 24, 28, 0.85);
            border: 1px solid var(--input-border); border-radius: var(--radius-md);
            color: #fff; font-size: 14px; padding: 0 44px 0 16px;
            font-family: var(--font-sans); outline: none; transition: border-color 0.15s ease;
        }
        .lock-input:focus { border-color: var(--accent); }
        .lock-eye-btn {
            position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
            background: none; border: none; color: var(--text-subtle); cursor: pointer; font-size: 15px;
        }
        .lock-eye-btn:hover { color: #fff; }
        .lock-btn {
            width: 100%; height: 44px; background: var(--accent);
            color: #fff; border: none; border-radius: var(--radius-md);
            font-size: 13.5px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: background 0.15s ease;
        }
        .lock-btn:hover { background: var(--accent-hover); }
        .lock-err { font-size: 12.5px; color: #ef4444; margin-top: 12px; display: none; }

        /* ── Top Header Navigation ── */
        .header {
            position: sticky; top: 0; z-index: 100; height: 64px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 32px; background: rgba(9, 9, 11, 0.85);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--card-border);
        }
        .header-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: #fff; }
        .brand-logo {
            width: 32px; height: 32px; border-radius: 8px;
            background: linear-gradient(135deg, #059669, #10b981);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 13px;
        }
        .brand-text { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; }
        .brand-badge {
            font-size: 11px; font-weight: 700; background: var(--accent-tint);
            color: var(--accent-light); padding: 3px 8px; border-radius: var(--radius-full);
            border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .header-actions { display: flex; align-items: center; gap: 14px; }
        .status-pill {
            display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600;
            color: #34d399; background: rgba(16, 185, 129, 0.1);
            padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; }
        .btn-logout {
            background: var(--input-bg); border: 1px solid var(--card-border);
            color: var(--text-muted); font-size: 12.5px; font-weight: 600;
            padding: 6px 14px; border-radius: var(--radius-full); cursor: pointer;
            transition: all 0.15s ease;
        }
        .btn-logout:hover { color: #fff; border-color: rgba(255, 255, 255, 0.2); }

        /* ── Hero / Studio Container ── */
        .container { max-width: 1360px; margin: 0 auto; padding: 32px 24px 80px; width: 100%; }

        /* ── Studio Two-Column Grid ── */
        .studio-grid {
            display: grid; grid-template-columns: 460px 1fr; gap: 24px;
            margin-bottom: 48px; align-items: start;
        }
        @media (max-width: 1080px) { .studio-grid { grid-template-columns: 1fr; } }

        .card {
            background: var(--card-bg); border: 1px solid var(--card-border);
            border-radius: var(--radius-lg); padding: 24px;
            transition: border-color 0.2s ease;
        }
        .card:hover { border-color: rgba(255, 255, 255, 0.15); }
        .card-header { margin-bottom: 20px; }
        .card-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .card-desc { font-size: 13px; color: var(--text-muted); line-height: 1.4; }

        .field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .field-label { font-size: 11.5px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; }
        .input-text, .select-input {
            width: 100%; height: 42px; background: var(--input-bg);
            border: 1px solid var(--input-border); color: #fff; font-size: 13.5px;
            padding: 0 14px; border-radius: var(--radius-md); font-family: var(--font-sans);
            outline: none; transition: border-color 0.15s ease;
        }
        .input-text:focus, .select-input:focus { border-color: var(--accent); }

        .ep-pills-wrap {
            display: flex; flex-wrap: wrap; gap: 6px; max-height: 120px;
            overflow-y: auto; padding: 6px 0; margin-bottom: 16px;
        }
        .ep-pill {
            padding: 6px 12px; background: var(--input-bg); border: 1px solid var(--card-border);
            border-radius: var(--radius-sm); color: var(--text-muted); font-size: 12px; font-weight: 600;
            cursor: pointer; transition: all 0.12s ease;
        }
        .ep-pill:hover { color: #fff; border-color: rgba(255, 255, 255, 0.2); }
        .ep-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }

        /* Code Generation Boxes */
        .code-box {
            background: #0c0c0e; border: 1px solid var(--card-border);
            border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 12px;
            position: relative;
        }
        .code-label { font-size: 11px; font-weight: 600; color: #71717a; margin-bottom: 6px; text-transform: uppercase; }
        .code-content {
            font-family: var(--font-mono); font-size: 12px; color: #34d399;
            word-break: break-all; line-height: 1.4; user-select: all;
        }
        .code-actions { display: flex; gap: 8px; margin-top: 10px; }
        .btn-copy {
            background: var(--input-bg); border: 1px solid var(--card-border);
            color: #fff; font-size: 12px; font-weight: 600; padding: 6px 12px;
            border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 6px;
            transition: all 0.15s ease;
        }
        .btn-copy:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.25); }
        .btn-copy.copied { background: #059669; border-color: #10b981; }

        /* Right Column Player Screen */
        .player-viewport-card {
            background: #000; border: 1px solid var(--card-border);
            border-radius: var(--radius-lg); overflow: hidden;
        }
        .player-topbar {
            height: 42px; background: #121215; border-bottom: 1px solid var(--card-border);
            display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
        }
        .player-topbar-title { font-size: 12.5px; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
        .player-window-controls { display: flex; gap: 6px; }
        .player-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); }
        .iframe-container {
            width: 100%; aspect-ratio: 16 / 9; position: relative; background: #000;
        }
        .iframe-container iframe {
            position: absolute; inset: 0; width: 100%; height: 100%; border: none;
        }

        /* ── Catalog Section ── */
        .section-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 24px; padding-bottom: 14px; border-bottom: 1px solid var(--card-border);
        }
        .section-title { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
        .catalog-search {
            height: 38px; width: 280px; background: var(--input-bg);
            border: 1px solid var(--card-border); border-radius: var(--radius-full);
            color: #fff; font-size: 13px; padding: 0 16px; outline: none;
            transition: all 0.15s ease;
        }
        .catalog-search:focus { border-color: var(--accent); width: 320px; }

        .catalog-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 20px;
        }
        .anime-card {
            background: var(--card-bg); border: 1px solid var(--card-border);
            border-radius: var(--radius-md); overflow: hidden;
            display: flex; flex-direction: column; cursor: pointer;
            transition: all 0.2s ease; position: relative;
        }
        .anime-card:hover {
            transform: translateY(-3px); border-color: var(--accent);
        }
        .anime-poster {
            width: 100%; aspect-ratio: 0.7; object-fit: cover; background: #1a1a1f;
        }
        .anime-info { padding: 12px; display: flex; flex-direction: column; gap: 6px; flex-grow: 1; }
        .anime-title {
            font-size: 13.5px; font-weight: 700; color: #fff; line-height: 1.35;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .anime-meta { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-subtle); margin-top: auto; }
        .ep-badge {
            background: rgba(16, 185, 129, 0.15); color: #34d399;
            font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 4px;
        }

        /* ── API Documentation Section ── */
        .api-table {
            width: 100%; border-collapse: collapse; margin-top: 14px;
            font-size: 13px; text-align: left;
        }
        .api-table th {
            padding: 12px 16px; background: rgba(255, 255, 255, 0.03);
            color: var(--text-muted); font-size: 11.5px; font-weight: 700; text-transform: uppercase;
            border-bottom: 1px solid var(--card-border);
        }
        .api-table td {
            padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            color: var(--text-main); vertical-align: middle;
        }
        .api-method {
            display: inline-block; font-size: 10px; font-weight: 800; font-family: var(--font-mono);
            padding: 3px 7px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399;
        }
        .api-endpoint { font-family: var(--font-mono); font-size: 12.5px; color: #fff; }
    </style>
</head>
<body>

<!-- ── Master Password Protection Modal with Frieren Anime Background ── -->
<div class="lock-overlay" id="lock-overlay">
    <div class="lock-card">
        <div class="lock-brand">
            <div class="brand-logo" style="margin: 0 auto 12px;"><i class="fa-solid fa-play"></i></div>
            <div class="lock-title">Anixo Hindi</div>
            <div class="lock-desc">Private Studio Access</div>
        </div>
        <div class="lock-input-group">
            <input type="password" id="lock-pass-input" class="lock-input" placeholder="Enter password..." autocomplete="off">
            <button class="lock-eye-btn" id="lock-eye-btn" type="button" onclick="togglePasswordVisibility()">
                <i class="fa-regular fa-eye"></i>
            </button>
        </div>
        <button class="lock-btn" id="lock-submit-btn" onclick="verifyPassword()">
            Login <i class="fa-solid fa-arrow-right"></i>
        </button>
        <div class="lock-err" id="lock-err">Invalid password. Please try again.</div>
    </div>
</div>

<!-- ── Top Header ── -->
<header class="header">
    <a href="/" class="header-brand">
        <div class="brand-logo"><i class="fa-solid fa-play"></i></div>
        <div class="brand-text">Anixo Hindi</div>
        <div class="brand-badge">Studio</div>
    </a>
    <div class="header-actions">
        <div class="status-pill">
            <span class="status-dot"></span>
            <span>Telegram MTProto Gateway Active</span>
        </div>
        <button class="btn-logout" onclick="lockConsole()">
            <i class="fa-solid fa-lock"></i> Lock
        </button>
    </div>
</header>

<main class="container">
    <!-- ── Interactive Studio Section ── -->
    <div class="studio-grid">
        <!-- Left: Configuration & Code Generator -->
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fa-solid fa-sliders" style="color:var(--accent);"></i> Embed Studio Controller
                </div>
                <div class="card-desc">Pick an uploaded Hindi Dub anime to generate embeds and preview stream.</div>
            </div>

            <!-- Anime Selector Dropdown -->
            <div class="field-group">
                <label class="field-label">Select Anime Series</label>
                <select id="series-select" class="select-input" onchange="onSeriesChange()">
                    <option value="">Loading uploaded series...</option>
                </select>
            </div>

            <!-- Episode Selector Pills -->
            <div class="field-group">
                <label class="field-label">Select Episode</label>
                <div class="ep-pills-wrap" id="ep-pills-wrap">
                    <!-- Populated via JS -->
                </div>
            </div>

            <!-- Custom AniList ID Input -->
            <div class="field-group" style="margin-top:8px;">
                <label class="field-label">Or Custom AniList ID</label>
                <div style="display:flex;gap:8px;">
                    <input type="number" id="custom-ani-id" class="input-text" placeholder="e.g. 132405" value="132405">
                    <input type="number" id="custom-ep" class="input-text" style="width:90px;" placeholder="EP" value="1">
                    <button class="btn-copy" style="flex-shrink:0;background:var(--accent);" onclick="loadCustom()">
                        Load <i class="fa-solid fa-bolt"></i>
                    </button>
                </div>
            </div>

            <hr style="border:none;border-top:1px solid var(--card-border);margin:18px 0;">

            <!-- Generated Iframe Code -->
            <div class="code-box">
                <div class="code-label">Responsive Iframe Code</div>
                <div class="code-content" id="code-iframe"></div>
                <div class="code-actions">
                    <button class="btn-copy" id="btn-copy-iframe" onclick="copySnippet('code-iframe', 'btn-copy-iframe')">
                        <i class="fa-regular fa-copy"></i> Copy Iframe
                    </button>
                    <button class="btn-copy" onclick="openCurrentPlayer()">
                        <i class="fa-solid fa-up-right-from-square"></i> Open Fullscreen
                    </button>
                </div>
            </div>

            <!-- Generated Direct Stream URL -->
            <div class="code-box">
                <div class="code-label">Direct Stream / Embed URL</div>
                <div class="code-content" id="code-url"></div>
                <div class="code-actions">
                    <button class="btn-copy" id="btn-copy-url" onclick="copySnippet('code-url', 'btn-copy-url')">
                        <i class="fa-regular fa-copy"></i> Copy URL
                    </button>
                </div>
            </div>
        </div>

        <!-- Right: Live JW Player Preview Screen -->
        <div>
            <div class="player-viewport-card">
                <div class="player-topbar">
                    <div class="player-topbar-title">
                        <i class="fa-solid fa-film" style="color:var(--accent);"></i>
                        <span id="player-title-display">My Dress-Up Darling - Episode 1</span>
                    </div>
                    <div class="player-window-controls">
                        <div class="player-dot"></div>
                        <div class="player-dot"></div>
                        <div class="player-dot"></div>
                    </div>
                </div>
                <div class="iframe-container">
                    <iframe id="live-player-iframe" src="/embed/ani/132405/1?autoPlay=1" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    </div>

    <!-- ── Uploaded Anime Catalog Grid ── -->
    <div class="section-header">
        <div class="section-title">
            <i class="fa-solid fa-clapperboard" style="color:var(--accent);"></i>
            <span>Uploaded Hindi Dub Series (<span id="total-anime-count">0</span>)</span>
        </div>
        <input type="text" id="catalog-search" class="catalog-search" placeholder="Search anime title..." oninput="filterCatalog()">
    </div>

    <div class="catalog-grid" id="catalog-grid">
        <!-- Populated via JS -->
    </div>

    <!-- ── API Endpoints Quick Reference ── -->
    <div class="card" style="margin-top:60px;">
        <div class="card-title">
            <i class="fa-solid fa-network-wired" style="color:var(--accent);"></i> API Routes & Integration Reference
        </div>
        <div class="card-desc">Direct endpoints for integrating with your frontends, mobile apps, or scrapers.</div>

        <table class="api-table">
            <thead>
                <tr>
                    <th>Method</th>
                    <th>Route</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><span class="api-method">GET</span></td>
                    <td class="api-endpoint">/embed/ani/:anilistId/:episode</td>
                    <td>Renders the Cinema JW Player 8 for the specified AniList ID & Episode.</td>
                </tr>
                <tr>
                    <td><span class="api-method">GET</span></td>
                    <td class="api-endpoint">/embed/mal/:malId/:episode</td>
                    <td>Renders the Cinema JW Player 8 for the specified MyAnimeList ID & Episode.</td>
                </tr>
                <tr>
                    <td><span class="api-method">GET</span></td>
                    <td class="api-endpoint">/embed/tmdb/:tmdbId/:episode</td>
                    <td>Automatically maps TMDB ID to AniList and plays the Hindi Dub episode.</td>
                </tr>
                <tr>
                    <td><span class="api-method">GET</span></td>
                    <td class="api-endpoint">/stream/:telegramMessageId.mp4</td>
                    <td>Direct HTTP 206 Byte-Range MP4 stream gateway directly from Telegram storage.</td>
                </tr>
                <tr>
                    <td><span class="api-method">GET</span></td>
                    <td class="api-endpoint">/api/resolve?ani=:id&ep=:ep</td>
                    <td>JSON stream resolver endpoint returning direct stream URL and file metadata.</td>
                </tr>
                <tr>
                    <td><span class="api-method">GET</span></td>
                    <td class="api-endpoint">/health</td>
                    <td>System health check verifying database and MTProto status.</td>
                </tr>
            </tbody>
        </table>
    </div>
</main>

<script>
// ── Password Protection Logic ──
const STORAGE_KEY = 'anixo_hindi_auth_token';
const lockOverlay = document.getElementById('lock-overlay');
const lockInput = document.getElementById('lock-pass-input');
const lockErr = document.getElementById('lock-err');

function checkAuth() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'anixo0909' || saved === 'Ritesh0909op@@@')) {
        lockOverlay.classList.add('unlocked');
        loadCatalogData();
    } else {
        lockOverlay.classList.remove('unlocked');
        setTimeout(() => lockInput.focus(), 200);
    }
}

function verifyPassword() {
    const entered = lockInput.value.trim();
    if (entered === 'anixo0909' || entered === 'Ritesh0909op@@@') {
        localStorage.setItem(STORAGE_KEY, entered);
        lockErr.style.display = 'none';
        lockOverlay.classList.add('unlocked');
        loadCatalogData();
    } else {
        lockErr.style.display = 'block';
    }
}

function lockConsole() {
    localStorage.removeItem(STORAGE_KEY);
    lockInput.value = '';
    lockOverlay.classList.remove('unlocked');
}

function togglePasswordVisibility() {
    const isPass = lockInput.type === 'password';
    lockInput.type = isPass ? 'text' : 'password';
    document.getElementById('lock-eye-btn').innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
}

lockInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyPassword();
});

// ── Catalog & Studio Data Management ──
let catalogData = [];
let currentSeries = null;
let currentEp = 1;

async function loadCatalogData() {
    try {
        const res = await fetch('/api/catalog');
        const json = await res.json();
        if (json.success && json.anime) {
            catalogData = json.anime;
            document.getElementById('total-anime-count').textContent = catalogData.length;
            populateSeriesDropdown();
            renderCatalogGrid(catalogData);

            if (catalogData.length > 0) {
                selectSeries(catalogData[0].anilist_id, 1);
            }
        }
    } catch(e) {
        console.error('Failed to load catalog:', e);
    }
}

function populateSeriesDropdown() {
    const select = document.getElementById('series-select');
    select.innerHTML = '';
    catalogData.forEach((item) => {
        const opt = document.createElement('option');
        opt.value = item.anilist_id;
        opt.textContent = \`\${item.title_english} (\${item.uploaded_count} EPs)\`;
        select.appendChild(opt);
    });
}

function onSeriesChange() {
    const select = document.getElementById('series-select');
    const aniId = parseInt(select.value, 10);
    selectSeries(aniId, 1);
}

function selectSeries(aniId, epNum = 1) {
    const match = catalogData.find(a => a.anilist_id === aniId);
    if (!match) return;

    currentSeries = match;
    currentEp = epNum;

    document.getElementById('series-select').value = aniId;
    document.getElementById('custom-ani-id').value = aniId;
    document.getElementById('custom-ep').value = epNum;

    // Render episode pills
    const pillsWrap = document.getElementById('ep-pills-wrap');
    pillsWrap.innerHTML = '';
    const eps = match.episodes_list ? match.episodes_list.split(',').map(Number) : [1];

    eps.forEach(ep => {
        const btn = document.createElement('button');
        btn.className = 'ep-pill' + (ep === currentEp ? ' active' : '');
        btn.textContent = 'EP ' + ep;
        btn.onclick = () => selectEpisode(ep);
        pillsWrap.appendChild(btn);
    });

    updatePlayerAndSnippets();
}

function selectEpisode(ep) {
    currentEp = ep;
    document.getElementById('custom-ep').value = ep;

    document.querySelectorAll('.ep-pill').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === 'EP ' + ep);
    });

    updatePlayerAndSnippets();
}

function loadCustom() {
    const aniId = parseInt(document.getElementById('custom-ani-id').value, 10);
    const ep = parseInt(document.getElementById('custom-ep').value, 10) || 1;
    selectSeries(aniId, ep);
}

function updatePlayerAndSnippets() {
    if (!currentSeries) return;

    const aniId = currentSeries.anilist_id;
    const ep = currentEp;
    const title = currentSeries.title_english;

    const embedUrl = \`\${window.location.origin}/embed/ani/\${aniId}/\${ep}\`;
    const embedSrc = \`\${embedUrl}?autoPlay=1\`;

    // Update Iframe
    document.getElementById('live-player-iframe').src = embedSrc;
    document.getElementById('player-title-display').textContent = \`\${title} - Episode \${ep}\`;

    // Snippets
    const iframeCode = \`<iframe src="\${embedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>\`;
    document.getElementById('code-iframe').textContent = iframeCode;
    document.getElementById('code-url').textContent = embedUrl;
}

function copySnippet(elementId, btnId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById(btnId);
        const originalHtml = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = originalHtml;
        }, 1800);
    });
}

function openCurrentPlayer() {
    if (currentSeries) {
        window.open(\`/embed/ani/\${currentSeries.anilist_id}/\${currentEp}\`, '_blank');
    }
}

// ── Catalog Grid Rendering ──
function renderCatalogGrid(items) {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';

    items.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.onclick = () => {
            selectSeries(anime.anilist_id, 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const poster = anime.cover_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300';

        card.innerHTML = \`
            <img class="anime-poster" src="\${poster}" loading="lazy" alt="\${anime.title_english}">
            <div class="anime-info">
                <div class="anime-title">\${anime.title_english}</div>
                <div class="anime-meta">
                    <span class="ep-badge">\${anime.uploaded_count} EPs</span>
                    <span>ID: \${anime.anilist_id}</span>
                </div>
            </div>
        \`;
        grid.appendChild(card);
    });
}

function filterCatalog() {
    const q = document.getElementById('catalog-search').value.toLowerCase().trim();
    const filtered = catalogData.filter(a => a.title_english.toLowerCase().includes(q));
    renderCatalogGrid(filtered);
}

// Init Auth Check
checkAuth();
</script>

</body>
</html>`;
}
