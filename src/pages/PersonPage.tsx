import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Person } from '../api/types';
import { Row } from '../components/Row';
import { TitleGrid } from '../components/TitleGrid';
import { useTitleList } from '../lib/catalog';
import { formatDate } from '../lib/format';
import { useQuery } from '../lib/useQuery';

export function PersonPage() {
  const id = Number(useParams().id);
  const { data: person, loading, error } = useQuery<Person>(`person:${id}`, () => api.person(id));
  const credits = useTitleList(id ? { person_id: id, sort_by: 'popularity_desc', limit: 40 } : null);

  if (loading) return <div className="page page--padded"><div className="skeleton-line" /></div>;
  if (error || !person) return <div className="page page--padded"><p className="error-text">Couldn't load this person{error ? `: ${error.message}` : ''}.</p></div>;

  const professions = [person.main_profession, person.secondary_profession].filter(Boolean).map((p) => p!.replace(/_/g, ' '));
  const knownFor = (person.known_for ?? []).map((tid) => ({ id: tid }));

  return (
    <div className="page page--padded">
      <header className="person-head">
        {person.headshot_url && <img src={person.headshot_url} alt="" className="person-photo" />}
        <div>
          <h1 className="page-title">{person.full_name}</h1>
          <p className="person-meta">
            {professions.length > 0 && <span className="capitalize">{professions.join(' · ')}</span>}
            {person.date_of_birth && <span>Born {formatDate(person.date_of_birth, { year: 'numeric', month: 'long', day: 'numeric' })}{person.place_of_birth ? ` in ${person.place_of_birth}` : ''}</span>}
            {person.date_of_death && <span>Died {formatDate(person.date_of_death, { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
          </p>
          {person.biography && <p className="person-bio">{person.biography}</p>}
        </div>
      </header>
      <div className="rows rows--flush">
        {!!knownFor.length && <Row title="Known For" items={knownFor} />}
      </div>
      <h2 className="row-title">Filmography</h2>
      <TitleGrid items={credits.data ?? []} loading={credits.loading} />
      {credits.data && !credits.data.length && <p className="muted">No titles found.</p>}
    </div>
  );
}
