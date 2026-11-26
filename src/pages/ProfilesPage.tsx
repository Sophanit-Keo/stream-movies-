import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { PencilIcon, PlusIcon } from '../components/Icons';
import { Logo } from '../components/Navbar';
import { PROFILE_COLORS, useApp, type Profile } from '../store/AppState';

const MAX_PROFILES = 5;

/** "Who's watching?" profile picker and editor. */
export function ProfilesPage() {
  const { profiles, selectProfile, saveProfile, deleteProfile } = useApp();
  const [params, setParams] = useSearchParams();
  const manage = params.get('manage') === '1';
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Partial<Profile> | null>(profiles.length ? null : { name: '', color: PROFILE_COLORS[0], kids: false });

  if (editing) {
    const first = !profiles.length;
    return (
      <div className="gate">
        <div className="gate-logo"><Logo /></div>
        <ProfileEditor
          initial={editing}
          title={first ? 'Create your profile' : editing.id ? 'Edit Profile' : 'Add Profile'}
          subtitle={first ? 'Each profile keeps its own My List, ratings and viewing history.' : undefined}
          canDelete={!!editing.id}
          canCancel={!first}
          onCancel={() => setEditing(null)}
          onDelete={() => {
            if (editing.id) deleteProfile(editing.id);
            setEditing(null);
          }}
          onSave={(p) => {
            const saved = saveProfile(p);
            setEditing(null);
            if (first) {
              selectProfile(saved.id);
              navigate('/browse');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="gate">
      <div className="gate-logo"><Logo /></div>
      <h1 className="gate-title">{manage ? 'Manage Profiles' : "Who's watching?"}</h1>
      <ul className="profile-list">
        {profiles.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={`profile-tile${manage ? ' is-managing' : ''}`}
              onClick={() => {
                if (manage) setEditing(p);
                else {
                  selectProfile(p.id);
                  navigate('/browse');
                }
              }}
            >
              <span className="profile-avatar">
                <Avatar profile={p} size={140} />
                {manage && <span className="profile-edit"><PencilIcon size={36} /></span>}
              </span>
              <span className="profile-name">{p.name}</span>
            </button>
          </li>
        ))}
        {profiles.length < MAX_PROFILES && (
          <li>
            <button type="button" className="profile-tile" onClick={() => setEditing({ name: '', color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length], kids: false })}>
              <span className="profile-avatar profile-add"><PlusIcon size={64} /></span>
              <span className="profile-name">Add Profile</span>
            </button>
          </li>
        )}
      </ul>
      <button
        type="button"
        className={`btn ${manage ? 'btn--white' : 'btn--outline'}`}
        onClick={() => setParams(manage ? {} : { manage: '1' })}
      >
        {manage ? 'Done' : 'Manage Profiles'}
      </button>
    </div>
  );
}

interface EditorProps {
  initial: Partial<Profile>;
  title: string;
  subtitle?: string;
  canDelete: boolean;
  canCancel: boolean;
  onSave: (p: Omit<Profile, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function ProfileEditor({ initial, title, subtitle, canDelete, canCancel, onSave, onCancel, onDelete }: EditorProps) {
  const [name, setName] = useState(initial.name ?? '');
  const [color, setColor] = useState(initial.color ?? PROFILE_COLORS[0]);
  const [kids, setKids] = useState(!!initial.kids);
  const valid = name.trim().length > 0;

  return (
    <form
      className="profile-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ id: initial.id, name: name.trim().slice(0, 24), color, kids });
      }}
    >
      <h1 className="gate-title gate-title--left">{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}
      <hr />
      <div className="profile-editor-body">
        <Avatar profile={{ name, color, kids }} size={120} />
        <div className="profile-editor-fields">
          <input
            className="input"
            placeholder="Name"
            value={name}
            maxLength={24}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            aria-label="Profile name"
          />
          <div className="swatches" role="radiogroup" aria-label="Profile color">
            {PROFILE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === color}
                aria-label={`Color ${c}`}
                className={`swatch${c === color ? ' is-active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} />
            <span>
              Kids profile
              <small>Shows family titles and hides titles rated PG-13, TV-14 and above.</small>
            </span>
          </label>
        </div>
      </div>
      <hr />
      <div className="profile-editor-actions">
        <button type="submit" className="btn btn--white" disabled={!valid}>Save</button>
        {canCancel && <button type="button" className="btn btn--outline" onClick={onCancel}>Cancel</button>}
        {canDelete && <button type="button" className="btn btn--outline" onClick={onDelete}>Delete Profile</button>}
      </div>
    </form>
  );
}
