import { Link } from 'react-router-dom';
import { APP_NAME } from './Navbar';

export function Footer() {
  return (
    <footer className="footer">
      <nav className="footer-links" aria-label="Footer">
        <Link to="/browse">Home</Link>
        <Link to="/tv">TV Shows</Link>
        <Link to="/movies">Movies</Link>
        <Link to="/explore?free=1">Free to Watch</Link>
        <Link to="/latest">New &amp; Popular</Link>
        <Link to="/explore">Browse by Service</Link>
        <Link to="/my-list">My List</Link>
        <Link to="/account">Account</Link>
        <Link to="/profiles?manage=1">Manage Profiles</Link>
      </nav>
      <p className="footer-attribution">
        Streaming availability and title data provided by{' '}
        <a href="https://www.watchmode.com/" target="_blank" rel="noopener noreferrer">Watchmode</a>.
        Artwork may be hosted by third parties and belongs to its owners. Trailers play from YouTube;
        full titles open on the streaming service that carries them.
      </p>
      <p className="footer-copy">© {new Date().getFullYear()} {APP_NAME}</p>
    </footer>
  );
}
