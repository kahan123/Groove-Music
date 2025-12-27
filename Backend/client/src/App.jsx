import { useState, useEffect } from 'react';
import { User, ChevronLeft, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import MainView from './components/MainView';
import './App.css';
import './FullScreenPlayer.css';

function AppContent() {
  const [view, setView] = useState('home');
  const { user } = useMusic();
  const [history, setHistory] = useState(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use VITE_API_URL if set. 
  // Otherwise:
  // - In Development: default to localhost:3000
  // - In Production (Built): default to '' (relative path, same origin)
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

  const navigate = (newView) => {
    if (newView === view) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newView);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setView(newView);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setView(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setView(history[newIndex]);
    }
  };

  // Global Keyboard Shortcuts & Media Session
  const { isPlaying, togglePlay, nextSong, prevSong, currentSong } = useMusic();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        nextSong();
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        prevSong();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextSong, prevSong]);

  // Media Session API (Hardware Media Keys)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', prevSong);
      navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
  }, [togglePlay, nextSong, prevSong]);

  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: [
          { src: currentSong.cover, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    }
  }, [currentSong]);



  return (
    <div className="app-layout">
      <Sidebar
        setView={navigate}
        currentView={view}
        mobileOpen={isMobileMenuOpen}
        closeMobile={() => setIsMobileMenuOpen(false)}
      />

      {isMobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="top-bar">
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} color="white" />
          </button>

          {/* Navigation Arrows */}
          <div className="nav-arrows">
            <button
              className="nav-arrow"
              onClick={goBack}
              disabled={historyIndex === 0}
              style={{ opacity: historyIndex === 0 ? 0.5 : 1, cursor: historyIndex === 0 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={22} color="white" />
            </button>
            <button
              className="nav-arrow"
              onClick={goForward}
              disabled={historyIndex === history.length - 1}
              style={{ opacity: historyIndex === history.length - 1 ? 0.5 : 1, cursor: historyIndex === history.length - 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={22} color="white" />
            </button>
          </div>

          <div className="top-bar-actions" style={{ marginLeft: 'auto', position: 'relative' }}>

            {user ? (
              <>
                <div
                  className="user-profile"
                  title="Profile Menu"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        console.error("Avatar load failed:", user.avatar);
                        e.target.style.display = 'none';
                        if (e.target.parentElement) {
                          e.target.parentElement.style.backgroundColor = '#555';
                        }
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem' }}>
                      {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                  )}
                </div>

                {showProfileMenu && (
                  <>
                    <div
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="profile-menu" style={{
                      position: 'absolute',
                      top: '120%',
                      right: 0,
                      background: '#282828',
                      borderRadius: '4px',
                      padding: '4px',
                      minWidth: '160px',
                      boxShadow: '0 16px 24px rgba(0,0,0,0.3)',
                      zIndex: 999
                    }}>
                      <button
                        onClick={() => window.location.href = `${API_URL}/api/logout`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#3e3e3e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div
                className="user-profile"
                title="Login with Google"
                onClick={() => window.location.href = `${API_URL}/auth/google`}
              >
                <User size={24} color="#b3b3b3" />
              </div>
            )}
          </div>
        </header>

        <MainView view={view} setView={navigate} />

      </main>

      <PlayerBar setView={navigate} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <MusicProvider>
        <AppContent />
      </MusicProvider>
    </ToastProvider>
  );
}

export default App;
