import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { PersistentCache } from './cache.js';
import { createWatchmodeClient, loadCards, matchRoute, UpstreamError } from '../shared/watchmode.js';
import { demoImage, demoRequest } from '../shared/demo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiKey = (process.env.WATCHMODE_API_KEY || '').trim();
const demo = !apiKey || process.env.WATCHMODE_DEMO === 'true';
const region = (process.env.WATCHMODE_REGION || 'US').toUpperCase();
const port = Number(process.env.PORT) || 8787;
const ttlScale = Number(process.env.CACHE_TTL_SCALE) > 0 ? Number(process.env.CACHE_TTL_SCALE) : 1;

const cache = new PersistentCache({ file: demo ? null : path.join(root, '.cache', 'watchmode.json') });
const watchmode = demo ? null : createWatchmodeClient({ apiKey, cache, ttlScale });

/** One entry point for both modes, so routes don't care where data comes from. */
async function wmGet(pathname, query = {}) {
  if (!matchRoute(pathname)) throw new UpstreamError(404, { statusMessage: `Endpoint not available: ${pathname}` });
  if (demo) {
    const { status, body } = demoRequest(pathname, query, region);
    if (status !== 200) throw new UpstreamError(status, body);
    return { body, cache: 'DEMO' };
  }
  return watchmode.get(pathname, query);
}

function sendError(res, err) {
  if (err instanceof UpstreamError) {
    return res.status(err.status).json({ error: err.message, status: err.status });
  }
  console.error('[api]', err);
  const timeout = err?.name === 'TimeoutError';
  return res.status(timeout ? 504 : 502).json({ error: timeout ? 'Watchmode took too long to respond' : 'Could not reach Watchmode' });
}

const app = express();
app.disable('x-powered-by');

// The Android app can use this server instead of calling Watchmode directly
// (build it with VITE_API_BASE_URL). Its pages load from this origin.
const corsOrigins = new Set([
  'https://com.streammovies.app',
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
]);
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && corsOrigins.has(origin)) res.set({ 'Access-Control-Allow-Origin': origin, Vary: 'Origin' });
  next();
});

app.get('/api/config', (_req, res) => {
  res.json({ demo, region });
});

app.get('/api/status', async (_req, res) => {
  if (demo) return res.json({ demo: true, quota: null, quotaUsed: null, cache: cache.stats() });
  try {
    const quota = await watchmode.status();
    res.json({ demo: false, ...quota, cache: cache.stats() });
  } catch (err) {
    res.json({ demo: false, ...watchmode.lastQuota(), error: err.message, cache: cache.stats() });
  }
});

// Card data for many titles at once. Each uncached title costs one credit, so
// the frontend only asks for titles that are actually on screen.
app.get('/api/cards', async (req, res) => {
  const ids = [...new Set(String(req.query.ids || '').split(','))].filter((id) => /^\d{1,10}$/.test(id)).slice(0, 40);
  try {
    const result = await loadCards(ids, async (id) => (await wmGet(`/title/${id}/details`)).body);
    res.set('Cache-Control', result.cards.length ? 'private, max-age=300' : 'no-store').json(result);
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/demo/img/:kind/:file', (req, res) => {
  const id = req.params.file.replace(/\.svg$/, '');
  if (!/^\d{1,12}$/.test(id)) return res.status(404).end();
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(demoImage(req.params.kind, id));
});

app.get('/api/wm/*', async (req, res) => {
  const pathname = `/${req.params[0]}`.replace(/\/+$/, '');
  try {
    const { body, cache: cacheState } = await wmGet(pathname, req.query);
    res.set({ 'X-Cache': cacheState, 'Cache-Control': 'private, max-age=300' }).json(body);
  } catch (err) {
    sendError(res, err);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

const dist = path.join(root, 'dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const server = app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
  console.log(demo
    ? '[api] DEMO MODE: no WATCHMODE_API_KEY set, serving generated sample data'
    : `[api] using Watchmode API (region ${region}, cache ${cache.stats().entries} entries)`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    cache.save();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}
