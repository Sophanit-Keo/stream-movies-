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
- **Free to Watch:** a home row, a menu link, and a **Free only** filter on the browse page for titles on free, ad-supported services. Those play the full movie or show at no cost on that service. When a title is free somewhere, its details show a **Watch Free** button that opens it there.
- **Browse by Service:** filter by streaming service, genre and type, and sort, with infinite scroll.
- **Search:** results update as you type, and matching people link to their own pages.
- **Person pages:** biography, Known For, and filmography.
- **Notifications bell:** new arrivals on streaming services.
- **Account page:** choose your country for where-to-watch, turn trailer autoplay on or off, and see API credit usage.
- **Responsive layout** for phones, tablets and desktop.
- **Android app:** an installable APK with a bottom tab bar and back-button support. It needs no server. See [Android app](#android-app).

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

## Android app

The `android/` folder holds a native Android app built with [Capacitor](https://capacitorjs.com/). It runs the same React app with phone-specific touches:

- A bottom tab bar (Home, New & Hot, Search, Browse, My List) and TV Shows / Movies chips at the top.
- The Android back button closes the title details, goes back a page, or leaves the app from Home.
- Edge-to-edge layout that keeps clear of the status bar and gesture bar.
- **Where to Watch** links go through Android, so Netflix, Prime Video and other links open in the service's app when it is installed.
- A dark launch screen and a launcher icon that follows themed icons on Android 13 and later.

**No server needed.** The app calls Watchmode directly. The first time it opens, it asks for your Watchmode API key and checks it, or you can tap **Try demo mode**. The key is saved only on that phone and is never built into the APK. Responses are cached on the phone, like the server's cache, to save credits. You can change the key or clear saved data on the Account page.

### Install on a phone

1. Get `app-debug.apk`: build it yourself (below), or download it from the **Android APK** workflow run in this repo's GitHub Actions tab (open the run, then **Artifacts**).
2. Copy it to your phone and open it. Android asks you to allow installs from that source (Files, Chrome, and so on) the first time.
3. Open **StreamMovies**, then enter your API key or choose demo mode.

The debug APK is signed with a development key. That is fine for your own phones. Publishing on Google Play needs a release build signed with your own key.

### Build the APK

Requirements: Node.js 22+, JDK 21, and the Android SDK (installed with [Android Studio](https://developer.android.com/studio), or set `ANDROID_HOME` to a command-line SDK).

```bash
npm install
npm run android:apk        # builds the web app, copies it into android/, runs Gradle
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

On Windows, run `npm run android:sync`, then `gradlew.bat assembleDebug` inside `android/`. To work in Android Studio (run on a device or emulator, debug, build a signed release), use `npm run android:sync`, then `npm run android:open`.

After changing anything under `src/`, run `npm run android:sync` again so the Android project gets the new build.

### Optional: use your own server instead

To keep the API key off the phones entirely (for example, if you give the app to other people), deploy the Node server and build the app with its address:

```bash
VITE_API_BASE_URL=https://your-server.example.com npm run android:apk
```

The server already allows requests from the app (origin `https://com.streammovies.app`). Add other origins with `CORS_ORIGINS`.

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
| `CORS_ORIGINS` | *(empty)* | Extra comma-separated origins allowed to call the server's API. |

Build-time options for the frontend (set them when running `npm run build` or `npm run android:apk`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | The Android app uses this server instead of calling Watchmode directly. |
| `VITE_API_MODE=direct` | Makes the web build call Watchmode from the browser too, with each visitor entering their own key. Useful for static hosting without a server. |

## Project layout

```
server/
  index.js       Express app: /api routes, card batching, static hosting
  cache.js       TTL cache saved to disk
shared/          Used by both the server and the Android app
  watchmode.js   Watchmode client: endpoint allowlist, caching, rate limiting
  demo.js        Generated sample data for demo mode
src/
  api/           API client; server or direct-to-Watchmode transport; on-device cache
  native/        Android back button and external links
  lib/           Data hooks, card store with lazy loading, formatting helpers
  store/         Profiles, My List, ratings and settings (stored in localStorage)
  components/    Navbar, Hero, Row, TitleCard, HoverPreview, DetailModal, ...
  pages/         Home / TV / Movies, New & Popular, Browse, Search, Person, Watch, Profiles, Account, Setup
android/         Capacitor Android project (Gradle)
capacitor.config.ts
```

## Licensing and attribution

The Watchmode Developer plan is for **non-commercial use** and requires attribution with a link to watchmode.com. The site footer includes this. Commercial use needs a paid Watchmode plan. Posters and backdrops may come from third parties and belong to their owners.
