import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { SourceKind, TitleSource } from '../api/types';
import { useSources } from '../lib/catalog';
import { isHttpUrl, regionName } from '../lib/format';
import { useQuery } from '../lib/useQuery';
import { ExternalIcon } from './Icons';

const GROUPS: { kind: SourceKind; label: string }[] = [
  { kind: 'sub', label: 'Stream' },
  { kind: 'free', label: 'Free' },
  { kind: 'tve', label: 'With TV provider' },
  { kind: 'rent', label: 'Rent' },
  { kind: 'buy', label: 'Buy' },
];

const FORMAT_RANK: Record<string, number> = { '4K': 3, HD: 2, SD: 1 };

/** One entry per service and type, keeping the best quality and lowest price. */
function collapse(sources: TitleSource[]) {
  const map = new Map<string, TitleSource & { formats: string[] }>();
  for (const s of sources) {
    const key = `${s.type}:${s.source_id}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...s, formats: s.format ? [s.format] : [] });
      continue;
    }
    if (s.format && !prev.formats.includes(s.format)) prev.formats.push(s.format);
    if (s.price !== null && (prev.price === null || s.price < prev.price)) prev.price = s.price;
    if (!isHttpUrl(prev.web_url) && isHttpUrl(s.web_url)) prev.web_url = s.web_url;
  }
  for (const s of map.values()) s.formats.sort((a, b) => (FORMAT_RANK[b] ?? 0) - (FORMAT_RANK[a] ?? 0));
  return [...map.values()];
}

export function useTitleSources(id: number, region: string) {
  return useQuery<TitleSource[]>(`title-sources:${id}:${region}`, () => api.titleSources(id, region));
}

/** Picks the source a Play button should open: subscription first, then free, then rent/buy. */
export function bestSource(sources: TitleSource[] | undefined) {
  if (!sources) return undefined;
  for (const kind of ['sub', 'free', 'tve', 'rent', 'buy'] as SourceKind[]) {
    const s = sources.find((x) => x.type === kind && isHttpUrl(x.web_url));
    if (s) return s;
  }
  return undefined;
}

export function WhereToWatch({ id, region, compact }: { id: number; region: string; compact?: boolean }) {
  const { data, loading, error } = useTitleSources(id, region);
  const { data: allSources } = useSources(region);
  const logos = new Map(allSources?.map((s) => [s.id, s.logo_100px]) ?? []);

  if (loading) return <div className="wtw"><div className="skeleton-line" /><div className="skeleton-line short" /></div>;
  if (error) return <p className="muted">Couldn't load streaming options ({error.message}).</p>;

  const items = collapse(data ?? []);
  if (!items.length) {
    return (
      <p className="muted">
        Not available to stream in {regionName(region)} right now.{' '}
        {!compact && <Link to="/account" className="link">Change country</Link>}
      </p>
    );
  }

  return (
    <div className={`wtw${compact ? ' wtw--compact' : ''}`}>
      {GROUPS.map(({ kind, label }) => {
        const group = items.filter((s) => s.type === kind);
        if (!group.length) return null;
        return (
          <div key={kind} className="wtw-group">
            <h4>{label}</h4>
            <ul>
              {group.map((s) => {
                const logo = logos.get(s.source_id);
                const content = (
                  <>
                    {logo ? <img src={logo} alt="" className="wtw-logo" /> : <span className="wtw-logo wtw-logo--text">{s.name.slice(0, 2)}</span>}
                    <span className="wtw-name">
                      {s.name}
                      <small>
                        {[s.formats.join(' · '), s.price !== null ? `$${s.price.toFixed(2)}` : null, s.seasons ? `${s.seasons} season${s.seasons > 1 ? 's' : ''}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                    </span>
                    {isHttpUrl(s.web_url) && <ExternalIcon size={16} className="wtw-ext" />}
                  </>
                );
                return (
                  <li key={`${s.type}:${s.source_id}`}>
                    {isHttpUrl(s.web_url) ? (
                      <a href={s.web_url} target="_blank" rel="noopener noreferrer" className="wtw-item">{content}</a>
                    ) : (
                      <div className="wtw-item">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {!compact && (
        <p className="wtw-note">
          Showing options in {regionName(region)}. <Link to="/account" className="link">Change</Link>
        </p>
      )}
    </div>
  );
}
