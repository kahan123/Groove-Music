import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, Heart } from 'lucide-react';

const LikedSongs = () => {
    const { likedSongs, user, isPlaying, currentSong, togglePlay, playSong } = useMusic();

    const isLikedPlaying = isPlaying && likedSongs.some(s => s.id === currentSong?.id);

    return (
        <div className="section">
            <div className="playlist-header">
                <div className="playlist-cover-art" style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)' }}>
                    <Heart size={64} color="white" fill="white" />
                </div>
                <div className="playlist-info">
                    <p className="playlist-label">Playlist</p>
                    <h1 className="playlist-title">Liked Songs</h1>
                    <div className="playlist-meta">
                        {user && (user.avatar ? <img src={user.avatar} referrerPolicy="no-referrer" style={{ width: '24px', height: '24px', borderRadius: '50%' }} /> : <span>{user.displayName} • </span>)}
                        <span>{likedSongs.length} songs</span>
                    </div>

                    {likedSongs.length > 0 && (
                        <button className="green-play-btn" onClick={() => {
                            if (isLikedPlaying) togglePlay();
                            else playSong(likedSongs[0], likedSongs);
                        }}>
                            {isLikedPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" style={{ marginLeft: '4px' }} />}
                        </button>
                    )}
                </div>
            </div>
            <div className="section-content" style={{ padding: '24px' }}>
                <div className="playlist-table-header">
                    <div>#</div>
                    <div></div>
                    <div>Title</div>
                    <div></div>
                </div>
                <div className="song-list">
                    {likedSongs.map((song, idx) => (
                        <div className="song-row" key={song.id} onClick={() => playSong(song, likedSongs)}>
                            <div className="index">
                                <span className="index-num">{idx + 1}</span>
                                <span className="play-icon"><Play size={14} fill="white" /></span>
                            </div>
                            <img src={song.cover} alt="Cover" />
                            <div className="song-row-title-cell">
                                <div className="song-row-title">{song.title}</div>
                                <div className="song-row-artist">{song.artist}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LikedSongs;
