import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useMusic } from '../context/MusicContext';

const StreamPlayer = forwardRef(({
    volume,
    onProgress,
    onDuration,
    onEnded,
    onBuffering,
    onReady
}, ref) => {
    const { currentSong, isPlaying, setIsPlaying, nextSong } = useMusic();
    const audioRef = useRef(null);
    const [lastSrc, setLastSrc] = useState(null);

    // API URL logic mirroring Context
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

    const getStreamUrl = (song) => {
        if (!song) return null;
        // Construct query: name + artist
        const query = `${song.title} ${song.artist}`;
        return `${API_URL}/api/song?name=${encodeURIComponent(query)}`;
    };

    useImperativeHandle(ref, () => ({
        play: () => audioRef.current?.play().catch(e => console.error("Play error:", e)),
        pause: () => audioRef.current?.pause(),
        get currentTime() { return audioRef.current?.currentTime || 0; },
        set currentTime(val) { if (audioRef.current) audioRef.current.currentTime = val; },
        get duration() { return audioRef.current?.duration || 0; },
        get paused() { return audioRef.current?.paused || true; },
        // Direct access if needed
        element: audioRef.current
    }));

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (!currentSong) {
            if (audioRef.current) {
                audioRef.current.src = "";
                setLastSrc(null);
            }
            return;
        }

        const newUrl = getStreamUrl(currentSong);

        // Prevent reloading if same song (url)
        if (newUrl === lastSrc) {
            if (isPlaying && audioRef.current?.paused) {
                audioRef.current.play().catch(e => console.error("Resume error:", e));
            }
            return;
        }

        if (audioRef.current) {
            audioRef.current.src = newUrl;
            setLastSrc(newUrl);
            audioRef.current.load();
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Autoplay prevented or error:", error);
                        setIsPlaying(false);
                    });
                }
            } else {
                setIsPlaying(false); // Reset state
            }
        }

    }, [currentSong]);

    // Watch 'isPlaying' from context to drive audio element
    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying && audioRef.current.paused) {
            audioRef.current.play().catch(() => setIsPlaying(false));
        } else if (!isPlaying && !audioRef.current.paused) {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const cur = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            if (onProgress) onProgress(cur);
            if (onDuration && !isNaN(dur) && dur > 0) onDuration(dur);
        }
    };

    const handleEnded = () => {
        if (onEnded) onEnded();
        else nextSong();
    };

    const handleWaiting = () => {
        if (onBuffering) onBuffering(true);
    };

    const handlePlaying = () => {
        if (onBuffering) onBuffering(false);
        if (onReady) onReady();
    };

    return (
        <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onCanPlay={() => onBuffering && onBuffering(false)}
            style={{ display: 'none' }}
        />
    );
});

export default StreamPlayer;
