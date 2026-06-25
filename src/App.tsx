import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

function App() {
  return (
    <div className="ft-app">
      {/* ── Header ── */}
      <header className="ft-header">
        <div className="ft-header-brand">
          <div className="ft-header-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 5h5M5 7.5h5M5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M11 4l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".5"/>
            </svg>
          </div>
          <div>
            <div className="ft-header-title">PDF Statement Generator</div>
            <div className="ft-header-sub">Offline-first CSV → PDF výpis</div>
          </div>
        </div>
        <div className="ft-header-meta">
          <span className="ft-badge ft-badge-offline">Offline</span>
        </div>
      </header>

      {/* ── Workspace ── */}
      <div className="ft-workspace">
        <LeftPanel />
        <RightPanel />
      </div>
    </div>
  );
}

export default App;
