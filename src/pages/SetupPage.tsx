import { useState } from 'react';
import { saveDirectSettings, verifyApiKey } from '../api/direct';
import { Logo } from '../components/Navbar';
import { openExternal } from '../native/platform';

/** First-run screen of the Android app: connect a Watchmode API key or try demo mode. */
export function SetupPage() {
  const [key, setKey] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const apiKey = key.trim();
    if (!apiKey) return;
    setChecking(true);
    setError(null);
    const problem = await verifyApiKey(apiKey);
    if (problem) {
      setError(problem);
      setChecking(false);
      return;
    }
    saveDirectSettings({ apiKey });
    window.location.reload();
  };

  return (
    <div className="gate setup">
      <div className="gate-logo"><Logo /></div>
      <form
        className="setup-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h1 className="gate-title gate-title--left">Connect to Watchmode</h1>
        <p className="muted">
          Titles, trailers and where-to-watch information come from Watchmode. Enter your free API key to start.
          It is stored only on this device.
        </p>
        <input
          className="input"
          placeholder="Watchmode API key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Watchmode API key"
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn--red" disabled={!key.trim() || checking}>
          {checking ? 'Checking…' : 'Continue'}
        </button>
        <button type="button" className="btn btn--outline" onClick={() => openExternal('https://api.watchmode.com/requestApiKey/')}>
          Get a free API key
        </button>
        <hr />
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            saveDirectSettings({ demo: true });
            window.location.reload();
          }}
        >
          Try demo mode with sample titles
        </button>
      </form>
    </div>
  );
}
