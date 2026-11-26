import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ApiStatus, Region } from '../api/types';
import { Avatar } from '../components/Avatar';
import { regionName } from '../lib/format';
import { useQuery } from '../lib/useQuery';
import { useApp } from '../store/AppState';

export function AccountPage() {
  const { config, settings, updateSettings, profile, history, myList } = useApp();
  const { data: regions } = useQuery<Region[]>('regions', api.regions);
  const { data: status, loading } = useQuery<ApiStatus>(`status:${Math.floor(Date.now() / 60000)}`, api.status);

  const enabled = (regions ?? []).filter((r) => r.plan_enabled !== false);
  const regionOptions = enabled.length ? enabled : (regions ?? []);
  const hasCurrent = regionOptions.some((r) => r.country === settings.region);
  const pct = status?.quota ? Math.min(100, Math.round(((status.quotaUsed ?? 0) / status.quota) * 100)) : null;

  return (
    <div className="page page--padded page--narrow">
      <h1 className="page-title">Account &amp; Settings</h1>

      <section className="panel">
        <h2>Profile</h2>
        {profile && (
          <div className="panel-row">
            <Avatar profile={profile} size={56} />
            <div>
              <strong>{profile.name}</strong>
              <p className="muted">
                {myList.length} in My List · {history.length} recently viewed{profile.kids ? ' · Kids profile' : ''}
              </p>
            </div>
            <Link to="/profiles?manage=1" className="btn btn--outline push-right">Manage Profiles</Link>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Playback &amp; Region</h2>
        <label className="field">
          <span>Country for “where to watch”</span>
          <select className="select" value={settings.region} onChange={(e) => updateSettings({ region: e.target.value })}>
            {!hasCurrent && <option value={settings.region}>{regionName(settings.region)}</option>}
            {regionOptions.map((r) => (
              <option key={r.country} value={r.country}>{r.name || regionName(r.country)}</option>
            ))}
          </select>
          <small className="muted">Your Watchmode plan decides which countries are available.</small>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={settings.autoplayPreviews} onChange={(e) => updateSettings({ autoplayPreviews: e.target.checked })} />
          <span>
            Autoplay trailer previews
            <small>Plays muted trailers on the home billboard and in title details.</small>
          </span>
        </label>
      </section>

      <section className="panel">
        <h2>Watchmode API</h2>
        {config.demo ? (
          <p>
            Running in <strong>demo mode</strong> with generated sample titles. Add <code>WATCHMODE_API_KEY</code> to your <code>.env</code> file
            and restart the server to load real movies and shows.{' '}
            <a className="link" href="https://api.watchmode.com/requestApiKey/" target="_blank" rel="noopener noreferrer">Get a free key</a>
          </p>
        ) : loading ? (
          <div className="skeleton-line" />
        ) : (
          <>
            {pct !== null ? (
              <>
                <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={status!.quota!} aria-valuenow={status!.quotaUsed ?? 0} aria-label="Credits used this month">
                  <span style={{ width: `${pct}%` }} className={pct > 85 ? 'is-high' : undefined} />
                </div>
                <p>
                  <strong>{(status!.quotaUsed ?? 0).toLocaleString()}</strong> of {status!.quota!.toLocaleString()} credits used this month ({pct}%).
                </p>
              </>
            ) : (
              <p className="muted">Quota information is unavailable{status?.error ? `: ${status.error}` : ''}.</p>
            )}
            {status && (
              <p className="muted">
                Server cache: {status.cache.entries.toLocaleString()} saved responses ({status.cache.hits.toLocaleString()} hits, {status.cache.misses.toLocaleString()} misses since start).
                Cached answers cost no credits.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
