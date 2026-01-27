import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useMusic } from '../context/MusicContext';

const HiddenYouTubePlayer = forwardRef(({
    volume,
    onProgress,
    onDuration,
    onEnded,
    onBuffering,
    onReady
}, ref) => {
    const { currentSong, isPlaying, setIsPlaying, nextSong } = useMusic();
    const playerRef = useRef(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const progressInterval = useRef(null);

    // Validate currentSong to ensure it's not null/undefined
    const activeSong = currentSong;

    // Initialize YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
            initializePlayer();
        };

        if (window.YT && window.YT.Player) {
            initializePlayer();
        }

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, []);

    const initializePlayer = () => {
        if (playerRef.current) return;

        // Ensure the element exists before initializing
        if (!document.getElementById('youtube-hidden-player')) return;

        playerRef.current = new window.YT.Player('youtube-hidden-player', {
            height: '0',
            width: '0',
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'disablekb': 1,
                'fs': 0,
                'origin': window.location.origin
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onStateChange': onPlayerStateChange,
                'onError': () => nextSong() // Silent error handling
            }
        });
    };

    const onPlayerReady = (event) => {
        setIsPlayerReady(true);
        event.target.setVolume(volume * 100);
        if (onReady) onReady();
    };

    const onPlayerStateChange = (event) => {
        const state = event.data;
        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering)

        if (state === window.YT.PlayerState.PLAYING) {
            startProgressTracker();
            if (onBuffering) onBuffering(false);
            if (!isPlaying) setIsPlaying(true);
        } else if (state === window.YT.PlayerState.PAUSED) {
            stopProgressTracker();
            if (isPlaying) setIsPlaying(false);
        } else if (state === window.YT.PlayerState.ENDED) {
            stopProgressTracker();
            if (onEnded) onEnded();
            else nextSong();
        } else if (state === window.YT.PlayerState.BUFFERING) {
            if (onBuffering) onBuffering(true);
        }
    };



    const startProgressTracker = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
        progressInterval.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const currentTime = playerRef.current.getCurrentTime();
                const duration = playerRef.current.getDuration();
                if (onProgress) onProgress(currentTime);
                if (onDuration && duration > 0) onDuration(duration);
            }
        }, 500);
    };

    const stopProgressTracker = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
    };

    // Load Song Logic
    useEffect(() => {
        const loadSong = async () => {
            if (!activeSong || !isPlayerReady || !playerRef.current) return;

            // Check if we have a valid YouTube ID (11 chars, typically)
            // iTunes IDs are numeric strings/numbers (e.g. "1196294581")
            const isYouTubeId = (id) => {
                if (!id) return false;
                const str = String(id);
                return str.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(str);
            };

            let videoId = null;
            const candidateId = activeSong.videoId || activeSong.id;

            if (isYouTubeId(candidateId)) {
                videoId = candidateId;
            }

            // If we don't have a valid videoId, fetch it from backend
            if (!videoId && (activeSong.title || activeSong.name)) {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
                    const query = `${activeSong.title} ${activeSong.artist || ''} audio`;
                    const res = await fetch(`${API_URL}/api/song?name=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    if (data.videoId && isYouTubeId(data.videoId)) {
                        videoId = data.videoId;
                    }
                } catch (e) {
                    // Fail silently
                }
            }

            if (videoId) {
                // If it's the same song, don't reload unless force? 
                // YouTube player usually handles loadVideoById fine.
                playerRef.current.loadVideoById(videoId);
            } else {
                // HiddenPlayer: No valid ID
                // Maybe text next song?
                // nextSong(); 
            }
        };

        loadSong();
    }, [activeSong?.id, activeSong?.title, activeSong?.videoId, isPlayerReady]);

    // Volume Sync
    useEffect(() => {
        if (playerRef.current && isPlayerReady) {
            playerRef.current.setVolume(volume * 100);
        }
    }, [volume, isPlayerReady]);

    // Play/Pause Sync from Context
    useEffect(() => {
        if (!isPlayerReady || !playerRef.current) return;
        const playerState = playerRef.current.getPlayerState();

        if (isPlaying && playerState !== window.YT.PlayerState.PLAYING && playerState !== window.YT.PlayerState.BUFFERING) {
            playerRef.current.playVideo();
        } else if (!isPlaying && playerState === window.YT.PlayerState.PLAYING) {
            playerRef.current.pauseVideo();
        }
    }, [isPlaying, isPlayerReady]);

    // Expose Audio Interface
    useImperativeHandle(ref, () => ({
        play: () => playerRef.current?.playVideo(),
        pause: () => playerRef.current?.pauseVideo(),
        get currentTime() {
            return playerRef.current && playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
        },
        set currentTime(val) {
            if (playerRef.current) playerRef.current.seekTo(val, true);
        },
        get duration() {
            return playerRef.current && playerRef.current.getDuration ? playerRef.current.getDuration() : 0;
        },
        // Helpers mostly used by PlayerBar
        get paused() {
            return playerRef.current ? playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING : true;
        }
    }));

    return (
        <div id="youtube-hidden-player" style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}></div>
    );
});

export default HiddenYouTubePlayer;
