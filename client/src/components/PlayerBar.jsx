import React, { useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Loader, Radio, Heart, PlusCircle } from 'lucide-react';
import AddToPlaylistModal from './AddToPlaylistModal';
import { useToast } from '../context/ToastContext';

const PlayerBar = () => {
    const { currentSong, isPlaying, setIsPlaying, isBuffering, setIsBuffering, togglePlay, nextSong, prevSong, startRadio, shuffle, toggleShuffle, repeat, toggleRepeat, likedSongs, toggleLike, playlists, user, addToPlaylist } = useMusic();
    const { error } = useToast();
    const audioRef = useRef(null);
    const [progress, setProgress] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [volume, setVolume] = React.useState(1);
    const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);

    useEffect(() => {
        if (currentSong && audioRef.current) {
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => console.error("Auto-play prevented", error));
                }
            } else {
                audioRef.current.pause();
            }
        }
    }, [currentSong, isPlaying]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    // Convert song title to stream URL if needed, or use ID. 
    // Assuming Backend provides: /song?name=Title
    const getStreamUrl = (song) => {
        if (!song) return undefined;
        // Construct a specific query for YouTube to find the right audio
        const query = `${song.title} ${song.artist} audio`;
        return `${import.meta.env.VITE_API_URL}/song?name=${encodeURIComponent(query)}`;
    };

    return (
        <footer className="player-bar">
            <div className="now-playing">
                {currentSong ? (
                    <>
                        <img src={currentSong.cover} alt="Cover" className="mini-cover" />
                        <div className="track-info">
                            <div className="track-name">{currentSong.title}</div>
                            <div className="track-artist">{currentSong.artist}</div>
                        </div>
                        <button
                            className="like-btn"
                            onClick={() => toggleLike(currentSong)}
                            style={{ background: 'none', border: 'none', padding: '0 8px', cursor: 'pointer' }}
                        >
                            <Heart
                                size={20}
                                color={likedSongs.some(s => s.id === currentSong.id) ? "#1db954" : "#b3b3b3"}
                                fill={likedSongs.some(s => s.id === currentSong.id) ? "#1db954" : "none"}
                            />
                        </button>
                        <button
                            className="add-to-playlist-btn"
                            onClick={() => {
                                if (!user) { error("Login required"); return; }
                                setShowPlaylistModal(true);
                            }}
                            title="Add to Playlist"
                            style={{ background: 'none', border: 'none', padding: '0 8px', cursor: 'pointer' }}
                        >
                            <PlusCircle size={20} color="#b3b3b3" />
                        </button>
                    </>
                ) : (
                    <div className="track-info">
                        <div className="track-name">Select a song</div>
                    </div>
                )}
            </div>

            <div className="player-controls">
                <div className="control-buttons">
                    <button
                        className={`control-btn ${shuffle ? 'active-control' : ''}`}
                        onClick={toggleShuffle}
                        title="Shuffle"
                    >
                        <Shuffle size={18} color={shuffle ? '#1db954' : 'currentColor'} />
                    </button>
                    <button className="control-btn" onClick={prevSong}><SkipBack size={24} /></button>
                    <button className="control-btn play-btn" onClick={togglePlay}>
                        {isBuffering ? (
                            <Loader size={20} className="spin-anim" color="black" />
                        ) : (
                            isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />
                        )}
                    </button>
                    <button className="control-btn" onClick={nextSong}><SkipForward size={24} /></button>
                    <button
                        className="control-btn"
                        title="Start Radio"
                        onClick={() => currentSong && startRadio(currentSong.artist)}
                    >
                        <Radio size={18} className={currentSong ? "" : "opacity-50"} />
                    </button>
                    <button
                        className={`control-btn ${repeat !== 'off' ? 'active-control' : ''}`}
                        onClick={toggleRepeat}
                        title={`Repeat ${repeat === 'one' ? 'One' : repeat === 'all' ? 'All' : 'Off'}`}
                    >
                        <Repeat size={18} color={repeat !== 'off' ? '#1db954' : 'currentColor'} />
                        {repeat === 'one' && <span className="repeat-one-indicator">1</span>}
                    </button>
                </div>
                <div className="progress-container">
                    <span className="time">{formatTime(progress)}</span>
                    <div className="seek-bar-wrapper">
                        {/* Visual Track */}
                        <div className="seek-bar-bg"></div>
                        {/* Visual Progress Fill */}
                        <div
                            className="seek-bar-fill"
                            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                        ></div>
                        {/* Interactive Input (Invisible but Clickable) */}
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={progress}
                            onChange={handleSeek}
                            className="seek-bar-input"
                        />
                    </div>
                    <span className="time">{formatTime(duration)}</span>
                </div>
            </div>

            <div className="volume-controls">
                <Volume2 size={20} color="#b3b3b3" />
                <div className="seek-bar-wrapper" style={{ width: '100px', flex: 'none' }}>
                    {/* Visual Track */}
                    <div className="seek-bar-bg"></div>
                    {/* Visual Progress Fill */}
                    <div
                        className="seek-bar-fill"
                        style={{ width: `${volume * 100}%` }}
                    ></div>
                    {/* Interactive Input */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setVolume(val);
                            if (audioRef.current) audioRef.current.volume = val;
                        }}
                        className="seek-bar-input"
                    />
                </div>
            </div>

            <audio
                ref={audioRef}
                src={getStreamUrl(currentSong)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onWaiting={() => setIsBuffering && setIsBuffering(true)}
                onPlaying={() => setIsBuffering && setIsBuffering(false)}
            />

            <AddToPlaylistModal
                isOpen={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
                song={currentSong}
            />
        </footer>
    );
};

export default PlayerBar;
