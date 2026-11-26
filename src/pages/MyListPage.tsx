import { Link } from 'react-router-dom';
import { TitleGrid } from '../components/TitleGrid';
import { useApp } from '../store/AppState';

export function MyListPage() {
  const { myList } = useApp();
  return (
    <div className="page page--padded">
      <h1 className="page-title">My List</h1>
      {myList.length ? (
        <TitleGrid items={myList} />
      ) : (
        <div className="empty">
          <p>You haven't added any titles to your list yet.</p>
          <p className="muted">
            Use the <strong>+</strong> button on any title to save it here. <Link to="/browse" className="link">Browse titles</Link>
          </p>
        </div>
      )}
    </div>
  );
}
