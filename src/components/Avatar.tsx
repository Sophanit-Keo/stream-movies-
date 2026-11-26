import type { Profile } from '../store/AppState';

/** A simple face on the profile's color. */
export function Avatar({ profile, size = 32 }: { profile: Pick<Profile, 'color' | 'name' | 'kids'>; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: profile.color }} aria-hidden="true">
      <svg viewBox="0 0 40 40" width="100%" height="100%">
        <circle cx="14" cy="16" r="2.6" fill="#fff" />
        <circle cx="26" cy="16" r="2.6" fill="#fff" />
        <path d="M12 25c4.5 4.2 11.5 4.2 16 0" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </svg>
      {profile.kids && <span className="avatar-kids">KIDS</span>}
    </span>
  );
}
