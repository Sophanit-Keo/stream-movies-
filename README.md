# StreamMovies

A streaming-style movie and TV app built on the [Watchmode API](https://api.watchmode.com/). Browse a catalog, watch trailers, and find where each title streams.

> **About playback:** Watchmode provides title data, trailers and streaming availability. It does not host films or episodes. **Play** opens the official trailer (from YouTube). **Where to Watch** opens the full title on the service that carries it, such as Netflix, Prime Video, Max or Disney+.

## Features

- **Profiles:** a "Who's watching?" screen, up to 5 profiles, each with its own My List, ratings and history. Kids profiles show family titles and hide anything rated PG‑13, TV‑14 or higher.
- **Home billboard:** a featured title with a muted trailer that starts on its own, a mute toggle, and Play / More Info buttons.
- **Rows:** Trending Now, Top 10 TV and movies with ranking numbers, New on Streaming, Popular on each service, genre rows, Critically Acclaimed, Coming Soon, Continue Watching and Because You Watched.
- **Hover previews:** rest the pointer on a card and an enlarged preview appears with Play, Add to My List, a thumbs rating and More Info.
- **Title details:** trailer, match score, maturity rating, cast and crew, where to watch (stream, free, rent or buy, with prices), a season picker with episodes, and More Like This.
- **TV Shows, Movies, and New & Popular pages**, including a dated Coming Soon list.
- **Browse by Service:** filter by streaming service, genre and type, and sort, with infinite scroll.
- **Search:** results update as you type, and matching people link to their own pages.
- **Person pages:** biography, Known For, and filmography.
- **Notifications bell:** new arrivals on streaming services.
- **Account page:** choose your country for where-to-watch, turn trailer autoplay on or off, and see API credit usage.
- **Responsive layout** for phones, tablets and desktop.

## Quick start

Requires Node.js 18.18 or newer.

```bash
npm install
cp .env.example .env      # then put your key in WATCHMODE_API_KEY
npm run dev
```

Open <http://localhost:5173>.

Get a free API key at <https://api.watchmode.com/requestApiKey/>. **Without a key, the app runs in demo mode** with generated sample titles, so you can try the UI first.

### Production

```bash
npm run build
npm start                 # serves the app and API on http://localhost:8787
```

## How it works

```
Browser (React + Vite)  ──/api──▶  Node server (Express)  ──X-API-Key──▶  api.watchmode.com/v1
                                     │
                                     └─ response cache on disk (.cache/watchmode.json)
```

The API key stays on the server and is never sent to the browser. The server only forwards a fixed list of Watchmode endpoints and parameters.

### Saving API credits

The free Developer plan includes **2,500 credits a month**. Each request costs at least one credit, and Watchmode's list endpoint returns titles without artwork. The app keeps usage down in these ways:

- **Server cache.** Every response is saved to disk and reused: lists for 12 hours, title details for 3 days, genres and services for 7 days. Repeat visits cost nothing. If Watchmode is unreachable or the quota runs out, expired entries are still served.
- **Lazy loading.** A row asks for its list only when you scroll near it. A card asks for its artwork (one details call) only when it appears on screen.
- **Free artwork where possible.** Release and search results already include posters, so those rows need no extra calls.
- **Rate limiting.** Requests are spaced to stay under Watchmode's per-minute limit.

A first full scroll of the home page costs roughly 80 credits. After that it is served from cache. Raise `CACHE_TTL_SCALE` to keep responses longer. The Account page shows your monthly usage.

## Configuration (`.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `WATCHMODE_API_KEY` | *(empty)* | Your Watchmode key. If empty, the app runs in demo mode. |
| `WATCHMODE_REGION` | `US` | Default country for where-to-watch. The free plan enables a few countries only. |
| `PORT` | `8787` | Port for the API server. The Vite dev server proxies `/api` to it. |
| `CACHE_TTL_SCALE` | `1` | Multiplies every cache lifetime. For example, `3` keeps entries three times longer. |
| `WATCHMODE_DEMO` | `false` | Set to `true` to force demo data even when a key is set. |

## Project layout

```
server/
  index.js       Express app: /api routes, card batching, static hosting
  watchmode.js   Watchmode client: endpoint allowlist, caching, rate limiting
  cache.js       TTL cache saved to disk
  demo.js        Generated sample data for demo mode
src/
  api/           Typed API client and response types
  lib/           Data hooks, card store with lazy loading, formatting helpers
  store/         Profiles, My List, ratings and settings (stored in localStorage)
  components/    Navbar, Hero, Row, TitleCard, HoverPreview, DetailModal, ...
  pages/         Home / TV / Movies, New & Popular, Browse, Search, Person, Watch, Profiles, Account
```

## Licensing and attribution

The Watchmode Developer plan is for **non-commercial use** and requires attribution with a link to watchmode.com. The site footer includes this. Commercial use needs a paid Watchmode plan. Posters and backdrops may come from third parties and belong to their owners.
