// Generated sample data for running the app without a Watchmode API key.
// Response shapes follow the Watchmode v1 API so the frontend code path is
// identical in demo and live mode. All titles, people and services here are
// fictional.

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261126);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const sample = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
};

// The trailer used for every demo title: "Big Buck Bunny" (CC BY 3.0, Blender Foundation).
const DEMO_TRAILER = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

export const DEMO_GENRES = [
  { id: 1, name: 'Action', tmdb_id: 28 },
  { id: 2, name: 'Adventure', tmdb_id: 12 },
  { id: 3, name: 'Animation', tmdb_id: 16 },
  { id: 4, name: 'Comedy', tmdb_id: 35 },
  { id: 5, name: 'Crime', tmdb_id: 80 },
  { id: 6, name: 'Documentary', tmdb_id: 99 },
  { id: 7, name: 'Drama', tmdb_id: 18 },
  { id: 8, name: 'Family', tmdb_id: 10751 },
  { id: 9, name: 'Fantasy', tmdb_id: 14 },
  { id: 12, name: 'Horror', tmdb_id: 27 },
  { id: 13, name: 'Kids', tmdb_id: 10762 },
  { id: 14, name: 'Mystery', tmdb_id: 9648 },
  { id: 15, name: 'Romance', tmdb_id: 10749 },
  { id: 16, name: 'Science Fiction', tmdb_id: 878 },
  { id: 17, name: 'Thriller', tmdb_id: 53 },
  { id: 33, name: 'Anime', tmdb_id: 0 },
];

const SOURCES = [
  { id: 9001, name: 'Nimbus+', type: 'sub', hue: 352 },
  { id: 9002, name: 'Orbit', type: 'sub', hue: 205 },
  { id: 9003, name: 'Lumen TV', type: 'sub', hue: 265 },
  { id: 9004, name: 'Harbor', type: 'sub', hue: 160 },
  { id: 9005, name: 'Kestrel', type: 'sub', hue: 30 },
  { id: 9006, name: 'Free Wave', type: 'free', hue: 95 },
  { id: 9007, name: 'Reel Store', type: 'purchase', hue: 45 },
  { id: 9008, name: 'Popcorn Market', type: 'purchase', hue: 0 },
];

const ADJ = ['Silent', 'Crimson', 'Hidden', 'Last', 'Broken', 'Golden', 'Midnight', 'Electric', 'Frozen', 'Wild',
  'Hollow', 'Northern', 'Distant', 'Velvet', 'Iron', 'Paper', 'Burning', 'Quiet', 'Neon', 'Lost', 'Bright', 'Savage',
  'Secret', 'Endless', 'Fallen', 'Little', 'Second', 'Glass', 'Shadow', 'Salt'];
const NOUN = ['Harbor', 'Kingdom', 'Signal', 'Orchard', 'Frontier', 'Empire', 'Detective', 'Garden', 'Horizon',
  'Protocol', 'Lighthouse', 'Circuit', 'Witness', 'Voyage', 'Tide', 'Crown', 'Summer', 'Station', 'Archive', 'Pilot',
  'Heist', 'Island', 'Machine', 'River', 'Comet', 'Inheritance', 'Mountain', 'Republic', 'Code', 'Season'];
const FIRST = ['Ava', 'Noah', 'Maya', 'Leo', 'Iris', 'Omar', 'Lena', 'Kai', 'Zara', 'Ezra', 'Nina', 'Theo', 'Sana',
  'Felix', 'Rosa', 'Hugo', 'Mira', 'Jonah', 'Elena', 'Ravi', 'Clara', 'Diego', 'Yuki', 'Amara'];
const LAST = ['Sterling', 'Okafor', 'Lindqvist', 'Moreau', 'Castillo', 'Nakamura', 'Brennan', 'Haddad', 'Kowalski',
  'Ferreira', 'Achebe', 'Voss', 'Delacroix', 'Mensah', 'Ivanova', 'Quinlan', 'Takeda', 'Abara', 'Holm', 'Vance'];
const PLOT_A = ['A disgraced investigator', 'Two estranged sisters', 'A young inventor', 'A retired smuggler',
  'An unlikely crew of strangers', 'A small-town teacher', 'A rookie pilot', 'A reclusive artist', 'A family of thieves',
  'An ambitious chef'];
const PLOT_B = ['uncovers a conspiracy that reaches the highest levels of power',
  'must survive one impossible night', 'returns home to settle an old score',
  'discovers a map that should not exist', 'races against time to stop a catastrophe',
  'finds love where they least expect it', 'is pulled into a world of magic and danger',
  'tries to pull off one last job', 'learns the truth about their past', 'starts a rebellion nobody saw coming'];

const today = new Date();
const isoDate = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

const img = (kind, id) => `/api/demo/img/${kind}/${id}.svg`;

export const DEMO_PEOPLE = Array.from({ length: 140 }, (_, i) => ({
  id: 7100000 + i,
  full_name: `${pick(FIRST)} ${pick(LAST)}`,
  main_profession: i % 9 === 0 ? 'director' : 'actor',
  date_of_birth: `${between(1950, 2002)}-0${between(1, 9)}-1${between(0, 9)}`,
  place_of_birth: pick(['Lisbon, Portugal', 'Osaka, Japan', 'Lagos, Nigeria', 'Toronto, Canada', 'Melbourne, Australia', 'Austin, Texas, USA']),
}));

const usedNames = new Set();
function uniqueTitle() {
  for (;;) {
    const r = rand();
    const name = r < 0.45 ? `The ${pick(ADJ)} ${pick(NOUN)}` : r < 0.8 ? `${pick(ADJ)} ${pick(NOUN)}` : `${pick(NOUN)} of ${pick(NOUN)}s`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
}

export const DEMO_TITLES = Array.from({ length: 320 }, (_, i) => {
  const isTv = rand() < 0.38;
  const genres = sample(DEMO_GENRES, between(1, 3));
  const year = between(1994, today.getFullYear());
  const releaseDate = isoDate(new Date(Date.UTC(year, between(0, 11), between(1, 28))));
  const kidsFriendly = genres.some((g) => ['Animation', 'Family', 'Kids'].includes(g.name));
  const id = 1000000 + i;
  return {
    id,
    title: uniqueTitle(),
    type: isTv ? (rand() < 0.15 ? 'tv_miniseries' : 'tv_series') : 'movie',
    year,
    end_year: isTv && rand() < 0.4 ? Math.min(year + between(1, 6), today.getFullYear()) : null,
    release_date: releaseDate,
    runtime_minutes: isTv ? between(22, 60) : between(84, 168),
    genres: genres.map((g) => g.id),
    genre_names: genres.map((g) => g.name),
    user_rating: Math.round((5 + rand() * 4.6) * 10) / 10,
    critic_score: between(38, 99),
    us_rating: kidsFriendly ? pick(['G', 'PG', 'TV-Y7', 'TV-G']) : pick(isTv ? ['TV-14', 'TV-MA', 'TV-PG'] : ['PG-13', 'R', 'PG']),
    popularity_percentile: Math.round(rand() * 1000) / 10,
    plot_overview: `${pick(PLOT_A)} ${pick(PLOT_B)}. ${pick(['Stunning and heartfelt.', 'A twisty, edge-of-your-seat ride.', 'Funny, warm and surprisingly sharp.', 'Dark, stylish and impossible to look away from.'])}`,
    sources: sample(SOURCES.filter((s) => s.type === 'sub'), between(1, 2))
      .concat(rand() < 0.25 ? [SOURCES[5]] : [])
      .concat(!isTv ? [SOURCES[6], SOURCES[7]] : []),
    cast: sample(DEMO_PEOPLE.filter((p) => p.main_profession === 'actor'), 6),
    director: pick(DEMO_PEOPLE.filter((p) => p.main_profession === 'director')),
    seasons: isTv ? between(1, 5) : 0,
  };
});

const byId = new Map(DEMO_TITLES.map((t) => [t.id, t]));

function details(t) {
  const similar = DEMO_TITLES.filter((o) => o.id !== t.id && o.genres.some((g) => t.genres.includes(g)))
    .slice((t.id * 7) % 40, ((t.id * 7) % 40) + 12)
    .map((o) => o.id);
  return {
    id: t.id,
    title: t.title,
    original_title: t.title,
    plot_overview: t.plot_overview,
    type: t.type,
    runtime_minutes: t.runtime_minutes,
    year: t.year,
    end_year: t.end_year,
    release_date: t.release_date,
    imdb_id: null,
    tmdb_id: null,
    tmdb_type: t.type === 'movie' ? 'movie' : 'tv',
    genres: t.genres,
    genre_names: t.genre_names,
    user_rating: t.user_rating,
    critic_score: t.critic_score,
    us_rating: t.us_rating,
    poster: img('poster', t.id),
    posterMedium: img('poster', t.id),
    posterLarge: img('poster', t.id),
    backdrop: img('backdrop', t.id),
    original_language: 'en',
    similar_titles: similar,
    networks: [],
    network_names: [],
    relevance_percentile: t.popularity_percentile,
    popularity_percentile: t.popularity_percentile,
    trailer: DEMO_TRAILER,
    trailer_thumbnail: img('backdrop', t.id),
  };
}

function lite(t) {
  return { id: t.id, title: t.title, year: t.year, imdb_id: null, tmdb_id: null, tmdb_type: t.type === 'movie' ? 'movie' : 'tv', type: t.type, popularity_percentile: t.popularity_percentile };
}

function titleSources(t, region) {
  const r = mulberry32(t.id);
  return t.sources.map((s) => ({
    source_id: s.id,
    name: s.name,
    type: s.type === 'purchase' ? (s.id === 9007 ? 'rent' : 'buy') : s.type,
    region,
    web_url: `https://example.com/demo/${s.id}/${t.id}`,
    ios_url: 'Deeplinks available for paid plans only.',
    android_url: 'Deeplinks available for paid plans only.',
    format: s.type === 'purchase' ? 'HD' : r() < 0.5 ? 'HD' : '4K',
    price: s.type === 'purchase' ? (s.id === 9007 ? 3.99 : 14.99) : null,
    seasons: t.seasons || null,
    episodes: t.seasons ? t.seasons * 8 : null,
  }));
}

function listTitles(q) {
  let list = DEMO_TITLES;
  if (q.types) {
    const types = q.types.split(',');
    list = list.filter((t) => types.includes(t.type));
  }
  if (q.genres) {
    const g = q.genres.split(',').map(Number);
    list = list.filter((t) => t.genres.some((x) => g.includes(x)));
  }
  if (q.source_ids) {
    const s = q.source_ids.split(',').map(Number);
    list = list.filter((t) => t.sources.some((x) => s.includes(x.id)));
  }
  if (q.person_id) {
    const pid = Number(q.person_id);
    list = list.filter((t) => t.director.id === pid || t.cast.some((c) => c.id === pid));
  }
  if (q.critic_score_low) list = list.filter((t) => t.critic_score >= Number(q.critic_score_low));
  if (q.user_rating_low) list = list.filter((t) => t.user_rating >= Number(q.user_rating_low));
  if (q.release_date_start) list = list.filter((t) => t.release_date >= q.release_date_start);
  if (q.release_date_end) list = list.filter((t) => t.release_date <= q.release_date_end);
  const sorters = {
    popularity_desc: (a, b) => b.popularity_percentile - a.popularity_percentile,
    popularity_asc: (a, b) => a.popularity_percentile - b.popularity_percentile,
    release_date_desc: (a, b) => b.release_date.localeCompare(a.release_date),
    release_date_asc: (a, b) => a.release_date.localeCompare(b.release_date),
    title_asc: (a, b) => a.title.localeCompare(b.title),
    title_desc: (a, b) => b.title.localeCompare(a.title),
  };
  const sorter = sorters[q.sort_by] ?? ((a, b) => b.critic_score + b.popularity_percentile - (a.critic_score + a.popularity_percentile));
  list = [...list].sort(sorter);
  const limit = Math.min(Math.max(Number(q.limit) || 250, 1), 250);
  const page = Math.max(Number(q.page) || 1, 1);
  return {
    titles: list.slice((page - 1) * limit, page * limit).map(lite),
    page,
    total_results: list.length,
    total_pages: Math.max(1, Math.ceil(list.length / limit)),
  };
}

const RELEASES = DEMO_TITLES.slice(0, 70).map((t, i) => {
  const source = t.sources[0];
  return {
    id: t.id,
    title: t.title,
    type: t.type,
    tmdb_id: null,
    tmdb_type: t.type === 'movie' ? 'movie' : 'tv',
    imdb_id: null,
    season_number: t.seasons ? t.seasons : null,
    poster_url: img('poster', t.id),
    source_release_date: isoDate(addDays(today, (i % 45) - 15)),
    source_id: source.id,
    source_name: source.name,
    is_original: i % 3 === 0 ? 1 : 0,
  };
});

function episodes(t, season) {
  const r = mulberry32(t.id);
  const p = (arr) => arr[Math.floor(r() * arr.length)];
  const out = [];
  for (let s = 1; s <= t.seasons; s++) {
    if (season && Number(season) !== s) continue;
    for (let e = 1; e <= 8; e++) {
      const id = t.id * 100 + s * 10 + e;
      out.push({
        id,
        name: `${p(['The', 'A'])} ${p(ADJ)} ${p(NOUN)}`,
        episode_number: e,
        season_number: s,
        season_id: t.id * 10 + s,
        tmdb_id: null,
        imdb_id: null,
        thumbnail_url: img('still', id),
        release_date: isoDate(new Date(Date.UTC(t.year + s - 1, 2, e * 7))),
        runtime_minutes: t.runtime_minutes + Math.floor(r() * 10) - 4,
        overview: `${p(PLOT_A)} ${p(PLOT_B)}.`,
        sources: [],
      });
    }
  }
  return out;
}

const json = (body) => ({ status: 200, body });
const notFound = () => ({ status: 404, body: { success: false, statusCode: 404, statusMessage: 'Title not found' } });

/** Answers a Watchmode path the same way the real API would. */
export function demoRequest(pathname, query, region = 'US') {
  if (pathname === '/genres') return json(DEMO_GENRES);
  if (pathname === '/regions') return json(['US', 'GB', 'CA'].map((c) => ({ country: c, name: c, flag: '', data_tier: 1, plan_enabled: true })));
  if (pathname === '/sources') {
    return json(SOURCES.map((s) => ({
      id: s.id, name: s.name, type: s.type, logo_100px: img('logo', s.id), regions: ['US', 'GB', 'CA'],
      ios_appstore_url: null, android_playstore_url: null, host_source_id: null, host_source: null,
    })));
  }
  if (pathname === '/list-titles') return json(listTitles(query));
  if (pathname === '/releases') {
    const start = query.start_date || isoDate(addDays(today, -1));
    const end = query.end_date || isoDate(addDays(today, 30));
    return json({ releases: RELEASES.filter((r) => r.source_release_date >= start && r.source_release_date <= end) });
  }
  if (pathname === '/autocomplete-search') {
    const q = String(query.search_value || '').toLowerCase();
    const type = Number(query.search_type || 1);
    const titles = type === 5 ? [] : DEMO_TITLES.filter((t) => t.title.toLowerCase().includes(q))
      .filter((t) => (type === 3 ? t.type === 'movie' : type === 4 ? t.type !== 'movie' : true))
      .slice(0, 20)
      .map((t) => ({ name: t.title, relevance: t.popularity_percentile, type: t.type, id: t.id, year: t.year, result_type: 'title', imdb_id: null, tmdb_id: null, tmdb_type: t.type === 'movie' ? 'movie' : 'tv', image_url: img('poster', t.id) }));
    const people = [1, 5].includes(type) ? DEMO_PEOPLE.filter((p) => p.full_name.toLowerCase().includes(q)).slice(0, 8)
      .map((p) => ({ name: p.full_name, relevance: 50, type: null, id: p.id, year: null, result_type: 'person', imdb_id: null, tmdb_id: null, tmdb_type: null, image_url: img('person', p.id) })) : [];
    return json({ results: [...titles, ...people] });
  }

  const titleMatch = pathname.match(/^\/title\/(\d+)\/([a-z-]+)$/);
  if (titleMatch) {
    const t = byId.get(Number(titleMatch[1]));
    if (!t) return notFound();
    switch (titleMatch[2]) {
      case 'details': return json(details(t));
      case 'sources': return json(titleSources(t, query.regions?.split(',')[0] || region));
      case 'seasons':
        return json(Array.from({ length: t.seasons }, (_, i) => ({
          id: t.id * 10 + i + 1, poster_url: img('poster', t.id), name: `Season ${i + 1}`, overview: '', number: i + 1,
          air_date: `${t.year + i}-03-01`, episode_count: 8,
        })));
      case 'episodes': return json(episodes(t, query.season));
      case 'cast-crew': {
        const r = mulberry32(t.id);
        const p2 = (arr) => arr[Math.floor(r() * arr.length)];
        return json([
          ...t.cast.map((p, i) => ({ person_id: p.id, type: 'Cast', full_name: p.full_name, role: `${p2(FIRST)} ${p2(LAST)}`, episode_count: t.seasons ? t.seasons * 8 : null, order: i })),
          { person_id: t.director.id, type: 'Crew', full_name: t.director.full_name, role: t.type === 'movie' ? 'Director' : 'Creator', episode_count: null, order: 0 },
        ]);
      }
      default: return notFound();
    }
  }

  const personMatch = pathname.match(/^\/person\/(\d+)$/);
  if (personMatch) {
    const p = DEMO_PEOPLE.find((x) => x.id === Number(personMatch[1]));
    if (!p) return notFound();
    const credits = DEMO_TITLES.filter((t) => t.director.id === p.id || t.cast.some((c) => c.id === p.id));
    const [first_name, last_name] = p.full_name.split(' ');
    return json({
      id: p.id, full_name: p.full_name, first_name, last_name, tmdb_id: null, imdb_id: null,
      main_profession: p.main_profession, secondary_profession: 'producer', tertiary_profession: null,
      date_of_birth: p.date_of_birth, date_of_death: null, place_of_birth: p.place_of_birth, gender: null,
      known_for: credits.slice(0, 6).map((t) => t.id), relevance_percentile: 60,
      biography: `${p.full_name} is a fictional ${p.main_profession} created for this app's demo mode, known for ${credits.slice(0, 2).map((t) => t.title).join(' and ') || 'independent work'}.`,
    });
  }
  return notFound();
}

function hash(n) {
  let h = Number(n) * 2654435761;
  h ^= h >>> 13;
  return Math.abs(h);
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}

function wrap(text, max) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

/** Abstract SVG artwork for demo posters, backdrops, logos and headshots. */
export function demoImage(kind, rawId) {
  const id = Number(rawId);
  const h = hash(id);
  const hue = SOURCES.find((s) => s.id === id)?.hue ?? h % 360;
  const hue2 = (hue + 40 + (h % 80)) % 360;
  const sizes = { poster: [400, 600], backdrop: [1280, 720], still: [640, 360], logo: [100, 100], person: [300, 300] };
  const [w, hgt] = sizes[kind] ?? sizes.backdrop;
  const shapes = Array.from({ length: 5 }, (_, i) => {
    const hh = hash(id + i * 97);
    const r = (hh % (w / 2)) + w / 8;
    return `<circle cx="${hh % w}" cy="${(hh >> 3) % hgt}" r="${r}" fill="hsl(${(hue + i * 25) % 360} 70% ${30 + (i % 3) * 12}%)" opacity="0.35"/>`;
  }).join('');
  let label = '';
  if (kind === 'poster') {
    const title = byId.get(id)?.title ?? '';
    const lines = wrap(title.toUpperCase(), 12);
    label = lines.map((l, i) => `<text x="200" y="${470 + (i - lines.length + 1) * 52}" text-anchor="middle" font-family="Impact, 'Arial Narrow', sans-serif" font-size="48" fill="#fff" letter-spacing="2">${escapeXml(l)}</text>`).join('');
  } else if (kind === 'logo') {
    const name = SOURCES.find((s) => s.id === id)?.name ?? '';
    label = `<text x="50" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${name.length > 9 ? 13 : 17}" fill="#fff">${escapeXml(name)}</text>`;
  } else if (kind === 'person') {
    label = `<circle cx="150" cy="120" r="55" fill="rgba(255,255,255,.35)"/><rect x="65" y="190" width="170" height="140" rx="80" fill="rgba(255,255,255,.35)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 65% 22%)"/><stop offset="1" stop-color="hsl(${hue2} 60% 10%)"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>${shapes}${label}</svg>`;
}
