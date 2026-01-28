import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { useToast } from '../context/ToastContext';
import { Home, Search, Library, PlusCircle, Heart, Radio, Rocket, Trash2, ListMusic, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const Sidebar = ({ setView, currentView, mobileOpen, closeMobile }) => {
    const { playlists, user, createPlaylist, deletePlaylist } = useMusic();
    const { error } = useToast();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [playlistToDelete, setPlaylistToDelete] = useState(null);

    const handleNavigation = (view) => {
        setView(view);
        if (mobileOpen && closeMobile) {
            closeMobile();
        }
    };

    return (
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
            {mobileOpen && (
                <button
                    className="mobile-close-btn"
                    onClick={closeMobile}
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white' }}
                >
                    <X size={24} />
                </button>
            )}
            <div className="brand">
                <img src="/LOGO_text.png" alt="Nano Banana" className="brand-logo-img" />
            </div>

            <nav className="nav-menu">
                <a onClick={() => handleNavigation('home')} className={`nav-item ${currentView === 'home' ? 'active' : ''}`}>
                    <Home size={20} /> Home
                </a>
                <a onClick={() => handleNavigation('search')} className={`nav-item ${currentView === 'search' ? 'active' : ''}`}>
                    <Search size={20} /> Search
                </a>
                <a onClick={() => handleNavigation('explore')} className={`nav-item ${currentView === 'explore' ? 'active' : ''}`}>
                    <Rocket size={20} /> Explore
                </a>
            </nav>

            <div className="playlist-section">
                <h3>YOUR PLAYLISTS</h3>

                {/* Liked Songs Special Playlist */}
                <div className="playlist-item" onClick={() => handleNavigation('liked')}>
                    <Heart size={18} fill="#1db954" color="#1db954" />
                    <span>Liked Songs</span>
                </div>

                {playlists.map(pl => (
                    <div key={pl._id} className="playlist-item group" onClick={() => handleNavigation(`playlist:${pl._id}`)}>
                        <ListMusic size={18} />
                        <span className="truncate flex-1">{pl.name}</span>
                        <button
                            className="delete-playlist-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPlaylistToDelete(pl);
                                setIsDeleteModalOpen(true);
                            }}
                            title="Delete Playlist"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                <div
                    className="playlist-item create-new"
                    onClick={async () => {
                        if (!user) {
                            error("Please login to create playlists!");
                            return;
                        }
                        const newId = await createPlaylist("New Playlist");
                        if (newId) {
                            handleNavigation(`playlist:${newId}`);
                        }
                    }}
                >
                    <PlusCircle size={18} /> Create Playlist
                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Delete Playlist"
                message={`Are you sure you want to delete "${playlistToDelete?.name}"?`}
                onConfirm={() => {
                    if (playlistToDelete) {
                        deletePlaylist(playlistToDelete._id);
                        if (currentView === `playlist:${playlistToDelete._id}`) setView('home');
                    }
                    setIsDeleteModalOpen(false);
                    setPlaylistToDelete(null);
                }}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setPlaylistToDelete(null);
                }}
            />
        </aside>
    );
};

export default Sidebar;
