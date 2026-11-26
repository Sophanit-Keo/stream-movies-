import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDetails } from '../components/DetailModal';
import { BackIcon, ExternalIcon, InfoIcon } from '../components/Icons';
import { bestSource, useTitleSources } from '../components/WhereToWatch';
import { useSources } from '../lib/catalog';
import { isHttpUrl, isTv, regionName, youtubeEmbed, youtubeId } from '../lib/format';
import { useApp } from '../store/AppState';

const KIND_LABEL: Record<string, string> = { sub: 'Included', free: 'Free', tve: 'TV provider', rent: 'Rent', buy: 'Buy' };

/** Full-screen trailer player with buttons to watch the full title on a real service. */
export function WatchPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { settings, recordView } = useApp();
  const { data: details, error } = useDetails(id);
  const { data: sources } = useTitleSources(id, settings.region);
  const { data: allSources } = useSources(settings.region);
  const logos = new Map(allSources?.map((s) => [s.id, s.logo_100px]) ?? []);

  useEffect(() => {
    if (details) recordView(details, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details?.id]);

  const videoId = youtubeId(details?.trailer);
  const best = bestSource(sources);
  const options = (sources ?? [])
    .filter((s) => isHttpUrl(s.web_url))
    .filter((s, i, arr) => arr.findIndex((x) => x.source_id === s.source_id && x.type === s.type) === i)
    .sort((a, b) => ['sub', 'free', 'tve', 'rent', 'buy'].indexOf(a.type) - ['sub', 'free', 'tve', 'rent', 'buy'].indexOf(b.type))
    .slice(0, 8);

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/browse'));

  return (
    <div className="watch">
      <div className="watch-bar">
        <button type="button" className="icon-btn" onClick={back} aria-label="Back">
          <BackIcon size={30} />
        </button>
        <div className="watch-heading">
          <span className="muted">{videoId ? 'Trailer' : 'Now showing'}</span>
          <strong>{details?.title ?? ' '}</strong>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => navigate(`/browse?title=${id}`)}>
          <InfoIcon size={20} /> Details
        </button>
      </div>

      <div className="watch-stage">
        {error && <p className="error-text">Couldn't load this title: {error.message}</p>}
        {videoId ? (
          <iframe
            className="watch-video"
            src={youtubeEmbed(videoId, { autoplay: true, controls: true })}
            title={`${details?.title ?? 'Title'} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          details && (
            <div className="watch-empty" style={details.backdrop ? { backgroundImage: `url("${details.backdrop}")` } : undefined}>
              <div>
                <h2>No trailer available</h2>
                <p>Watch the full {isTv(details.type) ? 'series' : 'movie'} on one of the services below.</p>
              </div>
            </div>
          )
        )}
      </div>

      <div className="watch-dock">
        {sources && !options.length && (
          <p className="muted">Not available to stream in {regionName(settings.region)} right now.</p>
        )}
        {!!options.length && (
          <>
            <span className="watch-dock-label">Watch the full {isTv(details?.type) ? 'series' : 'movie'} on</span>
            <div className="watch-options">
              {options.map((s) => (
                <a
                  key={`${s.type}-${s.source_id}`}
                  href={s.web_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`watch-option${s === best ? ' is-best' : ''}`}
                >
                  {logos.get(s.source_id) ? <img src={logos.get(s.source_id)!} alt="" /> : null}
                  <span>
                    <strong>{s.name}</strong>
                    <small>{KIND_LABEL[s.type] ?? s.type}{s.price !== null ? ` · $${s.price.toFixed(2)}` : ''}</small>
                  </span>
                  <ExternalIcon size={16} />
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
