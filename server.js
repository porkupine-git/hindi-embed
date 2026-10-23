/**
 * EMBED.ANIXOHINDI.CC - MASTER HINDI DUB EMBED & TELEGRAM STREAM PROVIDER
 * 
 * Supports: AniList ID, MAL ID, TMDB ID
 * Features: HTTP 206 Partial Content Seeking, JW Player 8, Pure Hindi Dub Stream
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { renderJwPlayerHtml } from './jwPlayerHtml.js';
import { renderLandingHtml } from './landingHtml.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4010', 10);
const HOST = process.env.HOST || '0.0.0.0';

const ALLOWED_ORIGINS = [
    'https://anixohindi.cc',
    'https://www.anixohindi.cc',
    'https://embed.anixohindi.cc',
    'http://localhost:3000',
    'http://localhost:4010',
    'http://localhost:8000',
    'http://127.0.0.1:4010'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isAllowed = ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed)) ||
                          origin.endsWith('.anixohindi.cc');
        if (isAllowed) return callback(null, true);
        return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// ── Search Engine Privacy & Complete De-Indexing Guard ───────
// Completely blocks embed subdomain from being indexed in Google / Bing / Yandex / Yahoo
app.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    next();
});

// Explicit Robots.txt: Tell all crawlers to not index, while permitting crawling of /embed/ so bots process noindex
app.get('/robots.txt', (req, res) => {
    res.type('text/plain; charset=utf-8');
    res.send(
`# AniXoHindi Embed Gateway Directives
# Notice: All video player embeds on this subdomain carry 'X-Robots-Tag: noindex'.
# Main Website: https://anixohindi.cc

User-agent: *
Disallow: /stream/
Disallow: /api/
Disallow: /js/

User-agent: Googlebot
Disallow: /stream/
Disallow: /api/
Disallow: /js/

User-agent: Googlebot-Video
Disallow: /stream/
Disallow: /api/
Disallow: /js/
`
    );
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// ── Stream Security & Anti-Theft Vault ──────────────────────
const STREAM_SECRET = process.env.STREAM_SECRET || 'anixo_hindi_dub_secure_stream_vault_key_2026';
const STREAM_KEY = crypto.createHash('sha256').update(STREAM_SECRET).digest();

function getClientIp(req) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return cfIp.trim();
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

function getIpSubnet(ip) {
    if (!ip) return '';
    ip = ip.trim().replace(/^::ffff:/, '');
    if (ip.includes('.')) {
        return ip.split('.').slice(0, 3).join('.');
    }
    if (ip.includes(':')) {
        return ip.split(':').slice(0, 3).join(':');
    }
    return ip;
}

function generateStreamToken(messageId, clientIp, ttlSeconds = 14400) {
    const iv = crypto.randomBytes(12);
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const ipSubnet = getIpSubnet(clientIp);
    const payload = JSON.stringify({ m: messageId, e: expiresAt, ip: ipSubnet });

    const cipher = crypto.createCipheriv('aes-256-gcm', STREAM_KEY, iv);
    let encrypted = cipher.update(payload, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return iv.toString('hex') + '.' + encrypted + '.' + authTag;
}

function verifyStreamToken(tokenStr, clientIp) {
    try {
        const parts = (tokenStr || '').split('.');
        if (parts.length !== 3) return { valid: false, reason: 'invalid_format' };
        const [ivHex, encHex, tagHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', STREAM_KEY, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        const data = JSON.parse(decrypted);
        const now = Math.floor(Date.now() / 1000);
        if (now > data.e) return { valid: false, reason: 'expired' };

        return { valid: true, messageId: data.m, expiresAt: data.e };
    } catch (err) {
        return { valid: false, reason: 'decryption_failed' };
    }
}

function isAuthorizedStreamRequest(req) {
    const referer = req.headers['referer'] || '';
    const origin = req.headers['origin'] || '';
    const secFetchDest = req.headers['sec-fetch-dest'] || '';
    const secFetchMode = req.headers['sec-fetch-mode'] || '';

    // Direct browser address bar navigation (downloading in tab)
    if (secFetchDest === 'document' || secFetchMode === 'navigate') {
        return { allowed: false, reason: 'direct_navigation_blocked' };
    }

    const hostToCheck = referer || origin;
    if (!hostToCheck) {
        return { allowed: false, reason: 'missing_referer' };
    }

    let parsedHost = '';
    try {
        parsedHost = new URL(hostToCheck).hostname;
    } catch {
        parsedHost = hostToCheck;
    }

    const allowedPatterns = [
        'embed.anixohindi.cc',
        'anixohindi.cc',
        'localhost',
        '127.0.0.1'
    ];

    const isAllowed = allowedPatterns.some(domain => 
        parsedHost === domain || parsedHost.endsWith('.' + domain)
    );

    if (!isAllowed) {
        return { allowed: false, reason: 'unauthorized_origin' };
    }

    return { allowed: true };
}

// ── 1. SQLite Database Connection ───────────────────────────
const DB_PATH = process.env.DB_PATH || '/www/wwwroot/anilist_database/anilist.db';
let db = null;
try {
    if (fs.existsSync(DB_PATH)) {
        db = new Database(DB_PATH, { readonly: true });
        console.log(`✅ SQLite Database Connected: ${DB_PATH}`);
    } else {
        console.warn(`⚠️ SQLite Database not found at: ${DB_PATH}. Will reconnect when available.`);
    }
} catch (dbErr) {
    console.error(`⚠️ SQLite Connection Error:`, dbErr.message);
}

// ── 2. Telegram MTProto Setup (Uses existing session) ───────
const TELEGRAM_SESSION_FILE = process.env.TELEGRAM_SESSION_FILE || '/home/ubuntu/teleanime/.telegram_session.txt';
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '38731827', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || 'f52eaaae40fbc572fcf046c82f620054';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8902447483:AAH-zDT_BUwV3WmuW9dvkdAVKWlHP4fJowI';
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004365995315';

let tgSession = '';
if (fs.existsSync(TELEGRAM_SESSION_FILE)) {
    try {
        tgSession = fs.readFileSync(TELEGRAM_SESSION_FILE, 'utf-8').trim();
    } catch {}
}

const client = new TelegramClient(new StringSession(tgSession), API_ID, API_HASH, {
    connectionRetries: 10,
    autoReconnect: true
});

let channelEntity = null;
async function initTelegram() {
    try {
        console.log('[*] Connecting to Telegram MTProto...');
        await client.start({ botAuthToken: BOT_TOKEN });
        channelEntity = await client.getEntity(CHANNEL_ID);
        console.log(`✅ Telegram Ready: ${channelEntity.title || channelEntity.id}`);
    } catch (err) {
        console.error('⚠️ Telegram Init Error:', err.message);
    }
}
initTelegram().catch(() => {});

// ── 3. Database Resolver Helper ─────────────────────────────
function resolveEpisode({ anilistId = null, malId = null, hindiId = null, episode = 1 }) {
    if (!db) {
        try {
            if (fs.existsSync(DB_PATH)) {
                db = new Database(DB_PATH, { readonly: true });
            }
        } catch {}
    }
    if (!db) return null;

    try {
        if (hindiId) {
            let query = `
                SELECT e.telegram_message_id, e.file_size_bytes, e.duration_seconds, a.title_english, a.anilist_id, a.mal_id, a.id as hindi_id
                FROM telegram_hindi_episodes e
                JOIN telegram_hindi_anime a ON e.anime_id = a.id
                WHERE a.id = ? 
                  AND e.episode_number = ? 
                  AND e.is_uploaded = 1
                LIMIT 1;
            `;
            return db.prepare(query).get(hindiId, episode);
        }

        let query = `
            SELECT e.telegram_message_id, e.file_size_bytes, e.duration_seconds, a.title_english, a.anilist_id, a.mal_id, a.id as hindi_id
            FROM telegram_hindi_episodes e
            JOIN telegram_hindi_anime a ON e.anime_id = a.id
            WHERE (a.anilist_id = ? OR a.mal_id = ?) 
              AND e.episode_number = ? 
              AND e.is_uploaded = 1
            LIMIT 1;
        `;
        return db.prepare(query).get(anilistId || 0, malId || 0, episode);
    } catch (err) {
        console.error('DB query error:', err.message);
        return null;
    }
}

// ── 4. TMDB ID to AniList ID Mapper (via AniZip) ─────────────
const tmdbCache = new Map();
async function mapTmdbToAniList(tmdbId) {
    if (tmdbCache.has(tmdbId)) return tmdbCache.get(tmdbId);
    try {
        const res = await fetch(`https://api.ani.zip/mappings?tmdb_id=${tmdbId}`);
        const data = await res.json();
        if (data && data.mappings?.anilist_id) {
            const aniId = data.mappings.anilist_id;
            tmdbCache.set(tmdbId, aniId);
            return aniId;
        }
    } catch (e) {
        console.warn(`AniZip TMDB lookup failed for ${tmdbId}:`, e.message);
    }
    return null;
}

// ── 5. Secure Telegram Video Range Stream Gateway (HTTP 206) ───
// Protected Tokenized Stream Endpoint (Anti-Leech / Expiring AES-256-GCM)
app.get('/stream/v/:token/play.mp4', async (req, res) => {
    // 1. Anti-leech / Anti-direct-download validation
    const authCheck = isAuthorizedStreamRequest(req);
    if (!authCheck.allowed) {
        return res.status(403).json({
            error: 'Forbidden',
            reason: authCheck.reason,
            message: 'Direct media download or unauthorized hotlinking is strictly prohibited.'
        });
    }

    // 2. Token verification
    const clientIp = getClientIp(req);
    const tokenResult = verifyStreamToken(req.params.token, clientIp);
    if (!tokenResult.valid) {
        return res.status(403).json({
            error: 'Forbidden',
            reason: tokenResult.reason,
            message: tokenResult.reason === 'expired'
                ? 'Stream playback token has expired. Please refresh the page.'
                : 'Invalid or manipulated stream token.'
        });
    }

    const messageId = tokenResult.messageId;
    if (!messageId) {
        return res.status(400).send('Invalid message identifier');
    }

    if (!channelEntity) {
        try {
            await initTelegram();
        } catch {}
        if (!channelEntity) {
            return res.status(503).send('Telegram stream gateway initializing, please retry.');
        }
    }

    try {
        const messages = await client.getMessages(channelEntity, { ids: [messageId] });
        const message = messages[0];
        if (!message || !message.media || !message.media.document) {
            return res.status(404).send('Video not found on Telegram channel');
        }

        const doc = message.media.document;
        const fileSize = Number(doc.size);
        const range = req.headers.range;

        // Security headers: do not allow public caching of authenticated stream chunks
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        if (req.method === 'HEAD') {
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunkSize = (end - start) + 1;
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': 'video/mp4'
                });
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                    'Accept-Ranges': 'bytes'
                });
            }
            return res.end();
        }

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4'
            });

            // Stream chunks directly from Telegram MTProto
            const iter = client.iterDownload({
                file: message.media,
                offset: BigInt(start),
                limit: chunkSize,
                requestSize: 512 * 1024 // 512 KB chunks for smooth seeking
            });

            for await (const chunk of iter) {
                if (res.writableEnded) break;
                res.write(chunk);
            }
            res.end();
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes'
            });

            const iter = client.iterDownload({
                file: message.media,
                requestSize: 512 * 1024
            });

            for await (const chunk of iter) {
                if (res.writableEnded) break;
                res.write(chunk);
            }
            res.end();
        }
    } catch (err) {
        console.error(`Stream Error for Msg ${messageId}:`, err.message);
        if (!res.headersSent) res.status(500).send('Streaming error: ' + err.message);
    }
});

// Legacy Unprotected Stream Route: Locked down against scrapers and F12 direct downloads
app.get('/stream/:messageId.mp4', (req, res) => {
    return res.status(403).type('application/json').send(JSON.stringify({
        error: 'Forbidden',
        message: 'Direct MP4 stream access is disabled. Please watch through official player at anixohindi.cc.'
    }));
});

// ── 6. Embed Routes (Authentic Cinema JW Player 8) ──────────

// AniList Embed: /embed/ani/:id/:ep
app.get(['/embed/ani/:id/:ep', '/embed/ani/:id'], (req, res) => {
    const anilistId = parseInt(req.params.id, 10);
    const ep = parseInt(req.params.ep || '1', 10);
    const autoPlay = req.query.autoPlay !== '0';

    const match = resolveEpisode({ anilistId, episode: ep });
    if (!match) {
        return res.status(404).send(`
            <div style="background:#000000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                <h2 style="color:#ef4444;margin-bottom:8px;font-size:18px;font-weight:700;">Episode Not Available Yet</h2>
                <p style="color:#94a3b8;font-size:14px;">Episode ${ep} Hindi Dub is currently in ingestion queue.</p>
            </div>
        `);
    }

    const clientIp = getClientIp(req);
    const streamToken = generateStreamToken(match.telegram_message_id, clientIp);
    const streamUrl = `/stream/v/${streamToken}/play.mp4`;
    const nextMatch = resolveEpisode({ anilistId, episode: ep + 1 });
    const nextEpUrl = nextMatch ? `/embed/ani/${anilistId}/${ep + 1}?autoPlay=1` : null;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderJwPlayerHtml({
        title: match.title_english,
        episode: ep,
        streamUrl,
        nextEpUrl,
        autoPlay,
        anilistId: match.anilist_id,
        malId: match.mal_id,
        hindiId: match.id || match.hindi_id
    }));
});

// MAL Embed: /embed/mal/:id/:ep
app.get(['/embed/mal/:id/:ep', '/embed/mal/:id'], (req, res) => {
    const malId = parseInt(req.params.id, 10);
    const ep = parseInt(req.params.ep || '1', 10);
    const autoPlay = req.query.autoPlay !== '0';

    const match = resolveEpisode({ malId, episode: ep });
    if (!match) {
        return res.status(404).send(`
            <div style="background:#000000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                <h2 style="color:#ef4444;margin-bottom:8px;font-size:18px;font-weight:700;">Episode Not Available Yet</h2>
                <p style="color:#94a3b8;font-size:14px;">Episode ${ep} Hindi Dub is currently in ingestion queue.</p>
            </div>
        `);
    }

    const clientIp = getClientIp(req);
    const streamToken = generateStreamToken(match.telegram_message_id, clientIp);
    const streamUrl = `/stream/v/${streamToken}/play.mp4`;
    const nextMatch = resolveEpisode({ malId, episode: ep + 1 });
    const nextEpUrl = nextMatch ? `/embed/mal/${malId}/${ep + 1}?autoPlay=1` : null;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderJwPlayerHtml({
        title: match.title_english,
        episode: ep,
        streamUrl,
        nextEpUrl,
        autoPlay,
        anilistId: match.anilist_id,
        malId: match.mal_id,
        hindiId: match.id || match.hindi_id
    }));
});

// TMDB Embed: /embed/tmdb/:id/:ep
app.get(['/embed/tmdb/:id/:ep', '/embed/tmdb/:id'], async (req, res) => {
    const tmdbId = parseInt(req.params.id, 10);
    const ep = parseInt(req.params.ep || '1', 10);
    const autoPlay = req.query.autoPlay !== '0';

    const aniId = await mapTmdbToAniList(tmdbId);
    const match = resolveEpisode({ anilistId: aniId, episode: ep });
    if (!match) {
        return res.status(404).send(`
            <div style="background:#000000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                <h2 style="color:#ef4444;margin-bottom:8px;font-size:18px;font-weight:700;">Episode Not Available Yet</h2>
                <p style="color:#94a3b8;font-size:14px;">TMDB ID ${tmdbId} Ep ${ep} Hindi Dub is currently in ingestion queue.</p>
            </div>
        `);
    }

    const clientIp = getClientIp(req);
    const streamToken = generateStreamToken(match.telegram_message_id, clientIp);
    const streamUrl = `/stream/v/${streamToken}/play.mp4`;
    const nextMatch = aniId ? resolveEpisode({ anilistId: aniId, episode: ep + 1 }) : null;
    const nextEpUrl = nextMatch ? `/embed/tmdb/${tmdbId}/${ep + 1}?autoPlay=1` : null;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderJwPlayerHtml({
        title: match.title_english,
        episode: ep,
        streamUrl,
        nextEpUrl,
        autoPlay,
        anilistId: match.anilist_id,
        malId: match.mal_id,
        hindiId: match.id || match.hindi_id
    }));
});

// Hindi DB ID Embed: /embed/id/:id/:ep or /embed/id/:id
app.get(['/embed/id/:id/:ep', '/embed/id/:id'], (req, res) => {
    const hindiId = parseInt(req.params.id, 10);
    const ep = parseInt(req.params.ep || '1', 10);
    const autoPlay = req.query.autoPlay !== '0';

    const match = resolveEpisode({ hindiId, episode: ep });
    if (!match) {
        return res.status(404).send(`
            <div style="background:#000000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                <h2 style="color:#ef4444;margin-bottom:8px;font-size:18px;font-weight:700;">Episode Not Available Yet</h2>
                <p style="color:#94a3b8;font-size:14px;">Episode ${ep} Hindi Dub is currently in ingestion queue.</p>
            </div>
        `);
    }

    const clientIp = getClientIp(req);
    const streamToken = generateStreamToken(match.telegram_message_id, clientIp);
    const streamUrl = `/stream/v/${streamToken}/play.mp4`;
    const nextMatch = resolveEpisode({ hindiId, episode: ep + 1 });
    const nextEpUrl = nextMatch ? `/embed/id/${hindiId}/${ep + 1}?autoPlay=1` : null;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderJwPlayerHtml({
        title: match.title_english,
        episode: ep,
        streamUrl,
        nextEpUrl,
        autoPlay,
        anilistId: match.anilist_id,
        malId: match.mal_id,
        hindiId: match.id || match.hindi_id
    }));
});

// Short URL Redirect: /e/:id/:ep
app.get('/e/:id/:ep', (req, res) => {
    res.redirect(`/embed/ani/${req.params.id}/${req.params.ep}`);
});

// ── 7. Root Frontend / Studio Console ───────────────────────
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderLandingHtml());
});

// ── 8. Catalog Data API (Comprehensive Hindi Database Catalog) ────
app.get('/api/catalog', (req, res) => {
    if (!db) {
        try {
            if (fs.existsSync(DB_PATH)) {
                db = new Database(DB_PATH, { readonly: true });
            }
        } catch {}
    }
    if (!db) return res.status(500).json({ success: false, message: 'Database not connected' });

    try {
        const query = `
            SELECT 
                a.id as hindi_id, 
                a.id,
                a.anilist_id, 
                a.mal_id, 
                COALESCE(m.title_english, a.title_english, a.title_romaji) as title,
                a.title_english,
                a.title_romaji,
                m.title_native,
                m.description as synopsis,
                COALESCE(m.cover_image, '') as cover_image,
                COALESCE(m.banner_image, m.cover_image, '') as banner_image,
                m.genres,
                m.average_score,
                COALESCE(a.year, m.year) as year,
                COALESCE(m.format, 'TV') as show_type,
                m.status as anilist_status,
                a.status as hindi_status,
                zm.titles_json,
                COUNT(e.id) as uploaded_count,
                GROUP_CONCAT(e.episode_number) as episodes_list
            FROM telegram_hindi_anime a
            JOIN telegram_hindi_episodes e ON a.id = e.anime_id
            LEFT JOIN anime m ON a.anilist_id = m.anilist_id
            LEFT JOIN anizip_mappings zm ON a.anilist_id = zm.anilist_id
            WHERE e.is_uploaded = 1
            GROUP BY a.id
            ORDER BY a.title_english ASC;
        `;
        const anime = db.prepare(query).all();
        res.json({ success: true, count: anime.length, anime });
    } catch (err) {
        console.error('Catalog fetch error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Full Anime Details & Episode List API
app.get('/api/anime/:identifier', (req, res) => {
    if (!db) {
        try {
            if (fs.existsSync(DB_PATH)) {
                db = new Database(DB_PATH, { readonly: true });
            }
        } catch {}
    }
    if (!db) return res.status(500).json({ success: false, message: 'Database not connected' });

    const rawId = req.params.identifier;
    const numId = parseInt(rawId, 10);

    try {
        let animeQuery = `
            SELECT 
                a.id as hindi_id, 
                a.id,
                a.anilist_id, 
                a.mal_id, 
                COALESCE(m.title_english, a.title_english, a.title_romaji) as title,
                a.title_english,
                a.title_romaji,
                m.title_native,
                m.description as synopsis,
                COALESCE(m.cover_image, '') as cover_image,
                COALESCE(m.banner_image, m.cover_image, '') as banner_image,
                m.genres,
                m.average_score,
                COALESCE(a.year, m.year) as year,
                COALESCE(m.format, 'TV') as show_type,
                m.status as anilist_status,
                a.status as hindi_status,
                zm.titles_json,
                zm.episodes_json
            FROM telegram_hindi_anime a
            LEFT JOIN anime m ON a.anilist_id = m.anilist_id
            LEFT JOIN anizip_mappings zm ON a.anilist_id = zm.anilist_id
            WHERE a.id = ? OR a.anilist_id = ?
            LIMIT 1;
        `;
        const anime = db.prepare(animeQuery).get(numId || 0, numId || 0);
        if (!anime) {
            return res.status(404).json({ success: false, message: 'Anime not found in Hindi database' });
        }

        const episodesQuery = `
            SELECT id, episode_number, episode_title, episode_thumbnail, duration_seconds, telegram_message_id, file_size_bytes
            FROM telegram_hindi_episodes
            WHERE anime_id = ? AND is_uploaded = 1
            ORDER BY episode_number ASC;
        `;
        const uploadedEps = db.prepare(episodesQuery).all(anime.hindi_id);

        let anizipEps = {};
        if (anime.episodes_json) {
            try { anizipEps = JSON.parse(anime.episodes_json); } catch {}
        }

        const episodes = uploadedEps.map(e => {
            const num = e.episode_number;
            const zipEp = anizipEps[String(num)] || {};
            const title = e.episode_title || zipEp.title?.en || zipEp.title?.ja || `Episode ${num}`;
            const image = e.episode_thumbnail || zipEp.image || anime.banner_image || anime.cover_image;
            const overview = zipEp.overview || zipEp.summary || '';
            const duration = e.duration_seconds ? `${Math.round(e.duration_seconds / 60)}m` : '24m';

            return {
                number: num,
                title: `Ep ${num}: ${title}`,
                clean_title: title,
                image,
                duration,
                overview,
                embed: `/embed/ani/${anime.anilist_id || anime.id}/${num}`,
                embed_id: `/embed/id/${anime.hindi_id}/${num}`,
                message_id: e.telegram_message_id
            };
        });

        res.json({
            success: true,
            anime: {
                ...anime,
                episodes_count: episodes.length,
                episodes_json: undefined // don't dump giant json in response
            },
            episodes
        });
    } catch (err) {
        console.error('Anime fetch error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// API Stream Resolver Endpoint (for external apps or React players)
app.get('/api/resolve', async (req, res) => {
    const anilistId = req.query.ani ? parseInt(req.query.ani, 10) : null;
    const malId = req.query.mal ? parseInt(req.query.mal, 10) : null;
    const tmdbId = req.query.tmdb ? parseInt(req.query.tmdb, 10) : null;
    const episode = parseInt(req.query.ep || '1', 10);

    let resolvedAniId = anilistId;
    if (!resolvedAniId && tmdbId) {
        resolvedAniId = await mapTmdbToAniList(tmdbId);
    }

    const match = resolveEpisode({ anilistId: resolvedAniId, malId, episode });
    if (!match) {
        return res.status(404).json({ success: false, message: 'Hindi Dub episode not found' });
    }

    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const clientIp = getClientIp(req);
    const streamToken = generateStreamToken(match.telegram_message_id, clientIp);
    const streamUrl = `${proto}://${host}/stream/v/${streamToken}/play.mp4`;

    res.json({
        success: true,
        title: match.title_english,
        episode,
        streamUrl,
        telegramMessageId: match.telegram_message_id,
        durationSeconds: match.duration_seconds,
        fileSizeBytes: match.file_size_bytes,
        quality: '1080p Full HD',
        audio: 'Hindi Dub'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'embed.anixohindi.cc',
        telegramConnected: Boolean(channelEntity),
        dbConnected: Boolean(db)
    });
});

app.listen(PORT, HOST, () => {
    console.log(`🚀 [embed.anixohindi.cc] Server running on http://${HOST}:${PORT}`);
});
