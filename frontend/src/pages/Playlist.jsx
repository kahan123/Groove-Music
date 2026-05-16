import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, Trash2 } from 'lucide-react';

const Playlist = ({ playlistId }) => {
    const { playlists, user, updatePlaylist, removeSongFromPlaylist, isPlaying, currentSong, togglePlay, playSong } = useMusic();
    const playlist = playlists.find(p => p._id === playlistId);
    
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        if (playlist) setName(playlist.name);
    }, [playlist]);

    if (!playlist) return <div className="section"><h2>Playlist Not Found</h2></div>;

    const handleRename = () => {
        if (name.trim() && name !== playlist.name) {
            updatePlaylist(playlist._id, name);
        }
        setIsEditing(false);
    };

    const isPlaylistPlaying = isPlaying && playlist.songs.some(s => (s.videoId || s.id) === currentSong?.id);

    return (
        <div className="playlist-page">
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
                            className="playlist-title-input"
                        />
                    ) : (
                        <h1 onClick={() => setIsEditing(true)} className="playlist-title">{playlist.name}</h1>
                    )}
                    <div className="playlist-meta">
                        {user?.displayName} • {playlist.songs.length} songs
                    </div>

                    {playlist.songs.length > 0 && (
                        <button className="green-play-btn" onClick={() => {
                            if (isPlaylistPlaying) togglePlay();
                            else {
                                const mapped = playlist.songs.map(s => ({ id: s.videoId, title: s.title, artist: s.artist, cover: s.cover }));
                                playSong(mapped[0], mapped);
                            }
                        }}>
                            {isPlaylistPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" style={{ marginLeft: '4px' }} />}
                        </button>
                    )}
                </div>
            </div>

            <div className="playlist-content">
                {playlist.songs.length > 0 && (
                    <div className="playlist-table">
                        <div className="playlist-table-header">
                            <div>#</div>
                            <div></div>
                            <div>Title</div>
                            <div></div>
                        </div>
                        <div className="song-list">
                            {playlist.songs.map((song, idx) => {
                                const mapped = { id: song.videoId, title: song.title, artist: song.artist, cover: song.cover };
                                const allMapped = playlist.songs.map(s => ({ id: s.videoId, title: s.title, artist: s.artist, cover: s.cover }));
                                return (
                                    <div className="song-row" key={song.videoId || idx} onClick={() => playSong(mapped, allMapped)}>
                                        <div className="index">
                                            <span className="index-num">{idx + 1}</span>
                                            <span className="play-icon"><Play size={14} fill="white" /></span>
                                        </div>
                                        <img src={song.cover} alt="Cover" />
                                        <div className="song-row-title-cell">
                                            <div className="song-row-title">{song.title}</div>
                                            <div className="song-row-artist">{song.artist}</div>
                                        </div>
                                        <div className="song-row-actions">
                                            <button onClick={(e) => { e.stopPropagation(); removeSongFromPlaylist(playlist._id, song.videoId); }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Playlist;
