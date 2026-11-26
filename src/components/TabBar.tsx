import { NavLink, useLocation } from 'react-router-dom';
import { BookmarkIcon, GridIcon, HomeIcon, SearchIcon, SparkIcon } from './Icons';

const TABS = [
  { to: '/browse', label: 'Home', Icon: HomeIcon, match: ['/browse', '/tv', '/movies'] },
  { to: '/latest', label: 'New & Hot', Icon: SparkIcon, match: ['/latest'] },
  { to: '/search', label: 'Search', Icon: SearchIcon, match: ['/search'] },
  { to: '/explore', label: 'Browse', Icon: GridIcon, match: ['/explore'] },
  { to: '/my-list', label: 'My List', Icon: BookmarkIcon, match: ['/my-list'] },
];

/** Bottom navigation for phones (shown by CSS on narrow screens). */
export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map(({ to, label, Icon, match }) => {
        const active = match.includes(pathname);
        return (
          <NavLink key={to} to={to} className={`tab${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={24} filled={active && Icon !== SearchIcon ? true : undefined} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
