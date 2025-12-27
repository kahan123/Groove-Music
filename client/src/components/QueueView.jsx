import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, Clock } from 'lucide-react';

const QueueView = () => {
    const { queue, currentSong, isPlaying, playSong, togglePlay } = useMusic();

    // Logic: 
    // "queue" in MusicContext usually acts as the *upcoming* songs or the *current context*.
    // If we want "Next Up", we typically look at the queue.
    // However, our current simple implementation might just have `queue` as the list of songs.
    // We need to find where `currentSong` is in the `queue` and show subsequent songs as "Next Up".

    const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
    const nextUp = currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;

    return (
        <div className="content-scroll" style={{ padding: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Queue</h1>

            {currentSong && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '16px', color: '#b3b3b3', marginBottom: '16px' }}>Now Playing</h2>
                    <div className="song-row active-song" onClick={() => togglePlay()}>
                        <div className="index">
                            <span className="play-icon" style={{ opacity: 1 }}>
                                {isPlaying ? <Pause size={14} fill="#1db954" color="#1db954" /> : <Play size={14} fill="white" />}
                            </span>
                        </div>
                        <img src={currentSong.cover} alt="Cover" />
                        <div className="song-row-title-cell">
                            <div className="song-row-title" style={{ color: '#1db954' }}>{currentSong.title}</div>
                            <div className="song-row-artist">{currentSong.artist}</div>
                        </div>
                        <div className="song-duration" style={{ marginLeft: 'auto', marginRight: '16px', color: '#b3b3b3', fontSize: '14px' }}>
                            {/* Duration would go here if we had it */}
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h2 style={{ fontSize: '16px', color: '#b3b3b3', marginBottom: '16px' }}>Next Up</h2>
                {nextUp.length > 0 ? (
                    <div className="song-list">
                        {nextUp.map((song, idx) => (
                            <div className="song-row" key={idx} onClick={() => playSong(song, queue)}>
                                {/* Note: passing 'queue' here resets the queue which might be fine, or we just play entry */}
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
                ) : (
                    <div style={{ color: '#b3b3b3', fontSize: '14px' }}>Your queue is empty. Go add some songs!</div>
                )}
            </div>
        </div>
    );
};

export default QueueView;
