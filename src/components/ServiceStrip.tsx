import { Link } from 'react-router-dom';
import type { Source } from '../api/types';

/** Logos of streaming services, each opening that service's catalog. */
export function ServiceStrip({ services, kind }: { services: Source[]; kind?: string }) {
  if (!services.length) return null;
  return (
    <section className="row services" aria-label="Browse by streaming service">
      <h2 className="row-title">Browse by Streaming Service</h2>
      <div className="services-track">
        {services.map((s) => (
          <Link key={s.id} to={`/explore?service=${s.id}${kind && kind !== 'all' ? `&type=${kind}` : ''}`} className="service-tile" title={s.name}>
            {s.logo_100px ? <img src={s.logo_100px} alt={s.name} loading="lazy" /> : <span>{s.name}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
