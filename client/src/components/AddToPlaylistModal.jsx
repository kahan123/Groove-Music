import React, { useState } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

const AddToPlaylistModal = ({ isOpen, onClose, song }) => {
    const { playlists, addToPlaylist, createPlaylist, removeSongFromPlaylist } = useMusic();
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen || !song) return null;

    const handleCreate = async () => {
        if (!newPlaylistName.trim()) return;
        await createPlaylist(newPlaylistName);
        setNewPlaylistName("");
        setIsCreating(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add to Playlist</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="song-preview">
                        <img src={song.cover} alt={song.title} />
                        <div>
                            <p className="song-title">{song.title}</p>
                            <p className="song-artist">{song.artist}</p>
                        </div>
                    </div>

                    <div className="playlist-list">
                        {playlists.map(playlist => {
                            const isAdded = playlist.songs && playlist.songs.some(s => s.videoId === song.id || s.videoId === song.videoId);

                            return (
                                <div key={playlist._id} className="playlist-item">
                                    <div className="playlist-info">
                                        <Music size={18} className="playlist-icon" />
                                        <span>{playlist.name}</span>
                                        <span className="song-count">{playlist.songs.length} songs</span>
                                    </div>
                                    <button
                                        className={`add-btn ${isAdded ? 'added' : ''}`}
                                        style={isAdded ? { borderColor: '#1db954', color: '#1db954' } : {}}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isAdded) {
                                                removeSongFromPlaylist(playlist._id, song.id || song.videoId);
                                            } else {
                                                addToPlaylist(playlist._id, song);
                                            }
                                            // Don't close immediately to allow multiple toggles if desired, or close? 
                                            // User request: "again clicking on that playlist would remove it" implies interaction flow. 
                                            // I'll keep it open.
                                        }}
                                    >
                                        {isAdded ? (
                                            <>
                                                <Check size={14} style={{ marginRight: '4px' }} /> Added
                                            </>
                                        ) : (
                                            "Add"
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {isCreating ? (
                        <div className="create-playlist-row">
                            <input
                                type="text"
                                placeholder="Playlist Name"
                                value={newPlaylistName}
                                onChange={e => setNewPlaylistName(e.target.value)}
                                autoFocus
                            />
                            <button onClick={handleCreate}>Create</button>
                        </div>
                    ) : (
                        <button className="create-new-btn" onClick={() => setIsCreating(true)}>
                            <Plus size={18} /> New Playlist
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
