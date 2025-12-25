
import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Heart, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import PlaylistMenu from './PlaylistMenu';

const ScrollableSection = ({ title, children }) => {
    const scrollRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 0);
        // showRight if we have more content to scroll to (with small buffer)
        setShowRight(scrollLeft < scrollWidth - clientWidth - 5);
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [children]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -(clientWidth * 0.7) : (clientWidth * 0.7);
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            // Check scroll arrows after animation
            setTimeout(checkScroll, 400);
        }
    };

    return (
        <section className="shelf-section shelf-relative">
            <h2>{title}</h2>
            {showLeft && (
                <button className="scroll-btn left" onClick={() => scroll('left')}>
                    <ChevronLeft size={24} />
                </button>
            )}
            <div
                className="shelf-scroll"
                ref={scrollRef}
                onScroll={checkScroll}
            >
                {children}
            </div>
            {showRight && (
                <button className="scroll-btn right" onClick={() => scroll('right')}>
                    <ChevronRight size={24} />
                </button>
            )}
        </section>
    );
};

const MainView = ({ view, setView }) => {
    const { playSong, likedSongs, playlists, user, addToPlaylist, updatePlaylist, createPlaylist, removeSongFromPlaylist } = useMusic();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    // Debounced Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim()) {
                performSearch(searchTerm);
            }
        }, 600); // 600ms delay for better UX

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const performSearch = async (term) => {
        if (!term) return;
        // Don't set state here if called from effect to avoid loop, 
        // but performSearch updates results which is fine.
        // We do want to set loading though.
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(term)}`);
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            performSearch(searchTerm);
        }
    };

    const browseCategories = [
        { title: 'Pop', color: 'rgb(255, 0, 100)' },
        { title: 'Hip-Hop', color: 'rgb(220, 20, 140)' },
        { title: 'Rock', color: 'rgb(230, 30, 50)' },
        { title: 'Indie', color: 'rgb(13, 114, 234)' },
        { title: 'RB', color: 'rgb(186, 93, 7)' },
        { title: 'Workout', color: 'rgb(141, 103, 171)' },
    ];

    // Home Data State
    const [shelves, setShelves] = useState([]);
    const [homeLoading, setHomeLoading] = useState(true);

    useEffect(() => {
        if (view === 'home' && shelves.length === 0) {
            fetch(`${API_URL}/home`)
                .then(res => res.json())
                .then(data => {
                    setShelves(data);
                    setHomeLoading(false);
                })
                .catch(err => console.error("Home fetch error", err));
        }
    }, [view]);

    const renderHome = () => (
        <div className="content-scroll">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Welcome Back</h1>
                    <p>Discover the world's best music.</p>
                </div>
            </section>

            {homeLoading ? (
                <div style={{ paddingBottom: '20px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-shelf">
                            <div className="skeleton-title"></div>
                            <div className="skeleton-row">
                                {[1, 2, 3, 4, 5].map(j => (
                                    <div key={j} className="skeleton-card">
                                        <div className="skeleton-image skeleton"></div>
                                        <div className="skeleton-text skeleton" style={{ width: '80%', height: '14px' }}></div>
                                        <div className="skeleton-text skeleton" style={{ width: '50%', height: '14px' }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                shelves.map((shelf, idx) => (
                    <ScrollableSection title={shelf.title} key={idx}>
                        {shelf.songs.map((song) => (
                            <div className="song-card shelf-card" key={song.id} onClick={() => playSong(song)}>
                                <div className="card-image-wrapper">
                                    <img src={song.cover} alt="Cover" loading="lazy" />
                                    <div className="play-overlay"><Play fill="white" size={32} /></div>
                                </div>
                                <h3>{song.title}</h3>
                                <p>{song.artist}</p>
                            </div>
                        ))}
                    </ScrollableSection>
                ))
            )}
        </div>
    );

    const renderExplore = () => (
        <div className="content-scroll">
            <div className="hero-section" style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800' }}>Explore</h1>
                <p style={{ color: '#b3b3b3' }}>Find your new favorite sound.</p>
            </div>

            <section>
                <div className="browse-grid">
                    {browseCategories.map((cat, i) => (
                        <div
                            key={i}
                            className="browse-card"
                            style={{ backgroundColor: cat.color }}
                            onClick={() => {
                                performSearch(cat.title);
                                setView('search');
                            }}
                        >
                            <h3>{cat.title}</h3>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );

    const renderSearch = () => (
        <div className="content-scroll">
            <div className="search-header" style={{ marginBottom: '40px' }}>
                <input
                    type="text"
                    className="big-search-input"
                    placeholder="What do you want to listen to?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                    autoFocus
                />
            </div>

            {loading ? (
                <div className="card-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton-image skeleton"></div>
                            <div className="skeleton-text skeleton" style={{ width: '80%', height: '14px' }}></div>
                            <div className="skeleton-text skeleton" style={{ width: '50%', height: '14px' }}></div>
                        </div>
                    ))}
                </div>
            ) : null}



            <div className="card-grid">
                {results.map((song) => (
                    <div className="song-card" key={song.id} onClick={() => playSong(song)}>
                        <div className="card-image-wrapper">
                            <img src={song.cover} alt="Cover" />
                            <div className="play-overlay"><Play fill="white" size={32} /></div>
                        </div>
                        <h3>{song.title}</h3>
                        <p>{song.artist}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const [activeMenuSong, setActiveMenuSong] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const renderSongCard = (song) => (
        <div className="song-card" key={song.id} onClick={() => playSong(song)}>
            <div className="card-image-wrapper">
                <img src={song.cover} alt="Cover" />
                <div className="play-overlay"><Play fill="white" size={32} /></div>
            </div>
            <h3>{song.title}</h3>
            <p>{song.artist}</p>

            <div className="card-overlay">
                <button className="play-btn" onClick={(e) => {
                    e.stopPropagation();
                    playSong(song);
                }}>
                    <Play size={24} fill="currentColor" />
                </button>
                {/* Add to Playlist Button */}
                <button className="add-btn" onClick={(e) => {
                    e.stopPropagation();
                    if (!user) { alert("Login required"); return; }

                    // Calculate position
                    const rect = e.target.getBoundingClientRect();
                    setMenuPosition({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX });
                    setActiveMenuSong(song);

                }} style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}>
                    +
                </button>
            </div>
        </div>
    );

    // Helper for list view
    const renderSongRow = (song, index, playlistId = null) => (
        <div className="song-row" key={song.id} onClick={() => playSong(song)}>
            <div className="index">
                <span className="index-num">{index + 1}</span>
                <span className="play-icon"><Play size={14} fill="white" /></span>
            </div>
            <img src={song.cover} alt="Cover" />
            <div className="song-row-title-cell">
                <div className="song-row-title">{song.title}</div>
                <div className="song-row-artist">{song.artist}</div>
            </div>
            {/* Album Removed */}
            <div className="song-row-actions">
                {/* Delete from Playlist Button */}
                {playlistId && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeSongFromPlaylist(playlistId, song.id);
                        }}
                        title="Remove from Playlist"
                        style={{ marginRight: '8px' }}
                    >
                        <Trash2 size={16} />
                    </button>
                )}


            </div>
        </div>
    );

    // ... (rest of component) ...

    const renderMenu = () => {
        if (!activeMenuSong) return null;
        return (
            <PlaylistMenu
                song={activeMenuSong}
                onClose={() => setActiveMenuSong(null)}
                style={{ top: menuPosition.top, left: menuPosition.left }}
            />
        );
    };

    // Playlist Views
    const renderPlaylistView = () => {
        if (view === 'liked') {
            return (
                <div className="section">
                    <div className="playlist-header">
                        <div className="playlist-cover-art">
                            <Heart size={64} color="white" fill="white" />
                        </div>
                        <div className="playlist-info">
                            <p className="playlist-label">Playlist</p>
                            <h1 className="playlist-title">Liked Songs</h1>
                            <div className="playlist-meta">
                                {user && (user.avatar ? <img src={user.avatar} referrerPolicy="no-referrer" style={{ width: '24px', height: '24px', borderRadius: '50%' }} /> : <span>{user.displayName} • </span>)}
                                <span>{likedSongs.length} songs</span>
                            </div>
                        </div>
                    </div>
                    <div className="section-content" style={{ padding: '24px' }}>
                        <div className="playlist-table-header">
                            <div>#</div>
                            <div></div>
                            <div>Title</div>
                            <div></div> {/* Empty for Actions align */}
                        </div>
                        <div className="song-list">
                            {likedSongs.map((song, idx) => renderSongRow(song, idx))}
                        </div>
                    </div>
                </div>
            );
        }

        if (view.startsWith('playlist:')) {
            const playlistId = view.split(':')[1];
            const playlist = playlists.find(p => p._id === playlistId);
            if (!playlist) return <div className="section"><h2>Playlist Not Found</h2></div>;

            return <PlaylistDetail playlist={playlist} />;
        }
        return null;
    };

    // Sub-component for Playlist Detail to handle local edit state
    const PlaylistDetail = ({ playlist }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [name, setName] = useState(playlist.name);


        useEffect(() => { setName(playlist.name); }, [playlist]);

        const handleRename = () => {
            if (name.trim() && name !== playlist.name) {
                updatePlaylist(playlist._id, name);
            }
            setIsEditing(false);
        };

        return (
            <div className="playlist-page">
                {/* Header */}
                <div className="playlist-header">
                    <div className="playlist-cover-art" style={{ background: '#282828' }}>
                        <span style={{ fontSize: '80px' }}>🎵</span>
                    </div>
                    <div className="playlist-info" style={{ width: '100%' }}>
                        <p className="playlist-label">Playlist</p>
                        {isEditing ? (
                            <input
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={e => e.key === 'Enter' && handleRename()}
                                className="playlist-title"
                                style={{
                                    background: 'transparent', border: 'none', color: 'white',
                                    width: '100%', outline: 'none'
                                }}
                            />
                        ) : (
                            <h1
                                onClick={() => setIsEditing(true)}
                                className="playlist-title"
                                style={{ cursor: 'pointer' }}
                            >{playlist.name}</h1>
                        )}
                        <div className="playlist-meta" style={{ color: '#b3b3b3' }}>
                            {user?.displayName} • {playlist.songs.length} songs
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="playlist-content" style={{ padding: '32px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), #121212)' }}>

                    {/* Song List */}
                    {playlist.songs && playlist.songs.length > 0 && (
                        <div style={{ marginBottom: '40px' }}>
                            <div className="playlist-table-header">
                                <div>#</div>
                                <div></div>
                                <div>Title</div>
                                <div></div>
                            </div>
                            <div className="song-list">
                                {playlist.songs.map((song, idx) => {
                                    const mapped = { id: song.videoId, title: song.title, artist: song.artist, cover: song.cover };
                                    return renderSongRow(mapped, idx, playlist._id);
                                })}
                            </div>
                        </div>
                    )}


                </div>
            </div>
        );
    };

    switch (view) {
        case 'search': return <>{renderSearch()}{renderMenu()}</>;
        case 'explore': return <>{renderExplore()}{renderMenu()}</>;
        case 'home': return <>{renderHome()}{renderMenu()}</>;
        default: return <>{renderPlaylistView()}{renderMenu()}</>;
    }
};

export default MainView;
