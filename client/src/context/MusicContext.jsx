import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useToast } from './ToastContext';
import { jwtDecode } from 'jwt-decode';

const MusicContext = createContext();

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
    const { success, error, info } = useToast();
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [queue, setQueue] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const audioRef = useRef(null); // Will be provided by Player component

    const provideAudioRef = (ref) => {
        audioRef.current = ref;
    };

    const [shuffle, setShuffle] = useState(false);
    const [user, setUser] = useState(null);
    const [repeat, setRepeat] = useState('off'); // 'off', 'one', 'all'
    const [history, setHistory] = useState([]);
    const [likedSongs, setLikedSongs] = useState([]);
    const [originalContext, setOriginalContext] = useState({ type: 'single', songs: [] });

    // Use VITE_API_URL if set. 
    // Otherwise:
    // - In Development: default to localhost:3000
    // - In Production (Built): default to '' (relative path, same origin)
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Use VITE_API_URL if set. 
    // Otherwise:
    // - In Development: default to localhost:3000
    // - In Production (Built): default to '' (relative path, same origin)
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

    const authFetch = async (endpoint, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (res.status === 401) {
            logout(); // Auto logout on invalid token
            // error("Session expired. Please login again.");
        }
        return res;
    };


    const login = async (credentialResponse) => {
        try {
            const googleToken = credentialResponse.credential;
            // Send to backend to verify and get user data
            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: googleToken })
            });

            if (!res.ok) throw new Error("Login failed");

            const data = await res.json();

            // Save Token
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);

            // Sync initial state
            if (data.user.likedSongs) {
                setLikedSongs(data.user.likedSongs.map(s => ({
                    id: s.videoId,
                    title: s.title,
                    artist: s.artist,
                    cover: s.cover
                })));
            }
            if (data.user.playlists) {
                setPlaylists(data.user.playlists);
            }
            success(`Welcome ${data.user.displayName}!`);

        } catch (err) {
            console.error("Login error", err);
            error("Login failed");
        }
    };

    useEffect(() => {
        // Check local storage for existing token on load
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            try {
                // Decode purely for UI immediately (optional), or verify with backend
                // For now, let's just fetch the user profile using the token to ensure it's valid
                authFetch('/api/current_user')
                    .then(res => {
                        if (res.ok) return res.json();
                        throw new Error("Invalid token");
                    })
                    .then(data => {
                        setUser(data);
                        if (data.likedSongs) {
                            setLikedSongs(data.likedSongs.map(s => ({
                                id: s.videoId,
                                title: s.title,
                                artist: s.artist,
                                cover: s.cover
                            })));
                        }
                        if (data.playlists) {
                            setPlaylists(data.playlists);
                        }
                    })
                    .catch(() => {
                        logout();
                    });
            } catch (e) { logout(); }
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLikedSongs([]);
        setPlaylists([]);
    };

    // Helper for auth headers


    const toggleLike = async (song) => {
        if (!user) {
            error("Login to like songs!");
            return;
        }

        // Optimistic update
        const isLiked = likedSongs.some(s => s.id === song.id);
        if (isLiked) {
            setLikedSongs(prev => prev.filter(s => s.id !== song.id));
        } else {
            setLikedSongs(prev => [...prev, song]);
        }

        try {
            const res = await authFetch('/api/likes', {
                method: 'POST',
                body: JSON.stringify({ song })
            });
            const updatedUser = await res.json();
            setUser(updatedUser);
            // Sync liked songs from backend format (videoId -> id)
            setLikedSongs(updatedUser.likedSongs.map(s => ({
                id: s.videoId,
                title: s.title,
                artist: s.artist,
                cover: s.cover
            })));
        } catch (err) {
            // Like failed
            // Revert? For now assume success or user refresh handles it
        }
    };

    const createPlaylist = async (name) => {
        if (!user) return null;
        try {
            const res = await authFetch('/api/playlists', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success(`Created playlist "${name}"`);
            // Return the new playlist ID (last one)
            return updatedUser.playlists[updatedUser.playlists.length - 1]._id;
        } catch (err) {
            // Create playlist failed
            error("Failed to create playlist");
            return null;
        }
    };

    const updatePlaylist = async (id, name) => {
        if (!user) return;
        try {
            const res = await authFetch(`/api/playlists/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name })
            });
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success("Playlist updated");
        } catch (err) {
            // Update playlist failed
            error("Failed to update playlist");
        }
    };

    const addToPlaylist = async (playlistId, song) => {
        if (!user) return;
        try {
            const res = await authFetch('/api/playlists/add', {
                method: 'POST',
                body: JSON.stringify({ playlistId, song })
            });
            if (!res.ok) {
                const text = await res.text();
                if (res.status === 400) throw new Error(text); // "Song already in playlist"
                throw new Error("Failed to add");
            }
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success(`Added to playlist!`);
        } catch (err) {
            // Add to playlist failed
            error(err.message || "Failed to add to playlist");
        }
    };

    const removeSongFromPlaylist = async (playlistId, songId) => {
        if (!user) return;
        try {
            const res = await authFetch(`/api/playlists/${playlistId}/songs/${songId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to remove song");
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success("Song removed from playlist");
        } catch (err) {
            // Remove song failed
            error("Failed to remove song");
        }
    };

    const deletePlaylist = async (id) => {
        if (!user) return;
        try {

            const res = await authFetch(`/api/playlists/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const text = await res.text();
                // Delete failed
                throw new Error(text || 'Delete failed');
            }
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success("Playlist deleted");
        } catch (err) {
            // Delete playlist failed
            error(`Failed to delete: ${err.message}`);
        }
    };

    const playSong = (song, contextSongs = null) => {
        if (!song) return;
        if (currentSong && currentSong.id === song.id) {
            togglePlay();
            return;
        }
        if (currentSong) {
            setHistory(prev => [...prev, currentSong]);
        }
        setCurrentSong(song);
        setIsPlaying(true);
        setIsBuffering(true);

        // Context Management
        if (contextSongs && Array.isArray(contextSongs)) {
            // Playlist Context
            const idx = contextSongs.findIndex(s => s.videoId === song.id || s.id === song.id);
            if (idx !== -1) {
                const newQueue = contextSongs.slice(idx + 1).map(s => ({
                    id: s.videoId || s.id,
                    title: s.title,
                    artist: s.artist,
                    cover: s.cover
                }));
                setQueue(newQueue);
                setOriginalContext({
                    type: 'playlist', songs: contextSongs.map(s => ({
                        id: s.videoId || s.id,
                        title: s.title,
                        artist: s.artist,
                        cover: s.cover
                    }))
                });
            }
        } else {
            // Single/Search Context
            setQueue([]);
            setOriginalContext({ type: 'single', songs: [] });
        }
    };

    const togglePlay = () => setIsPlaying(prev => !prev);

    const toggleShuffle = () => setShuffle(prev => !prev);

    const toggleRepeat = () => {
        setRepeat(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
    };



    const autoPlayRecommended = async (current) => {
        if (!current) return;

        try {
            // Build query params
            let url = `${API_URL}/api/recommend?trackId=${current.id}&title=${encodeURIComponent(current.title)}&artist=${encodeURIComponent(current.artist)}`;
            if (current.genre) {
                url += `&genre=${encodeURIComponent(current.genre)}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (data && data.length > 0) {

                setQueue(data);
                // Also optionally play the first one immediately if queue was empty
                const next = data[0];
                setQueue(prev => prev.slice(1));
                setHistory(prev => [...prev, current]);
                setCurrentSong(next);
                setIsPlaying(true);
            }
        } catch (err) {
            // Autoplay failed
        }
    };

    const nextSong = () => {
        if (repeat === 'one') {
            if (audioRef.current) {
                // HMR Ghost Check
                if (audioRef.current instanceof HTMLElement) return;
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        }

        if (queue.length > 0) {
            let nextIndex = 0;
            if (shuffle) {
                nextIndex = Math.floor(Math.random() * queue.length);
            }

            const next = queue[nextIndex];

            // Queue management: remove played song
            const newQueue = [...queue];
            newQueue.splice(nextIndex, 1);
            setQueue(newQueue);

            if (currentSong) {
                setHistory(prev => [...prev, currentSong]);
            }

            setCurrentSong(next);
            setIsPlaying(true);
        } else {
            // Queue empty - check logic
            if (repeat === 'all') {
                if (originalContext.type === 'playlist' && originalContext.songs.length > 0) {
                    // Loop Playlist

                    const firstSong = originalContext.songs[0];
                    const newQueue = originalContext.songs.slice(1);
                    setQueue(newQueue); // Re-fill queue
                    if (currentSong) setHistory(prev => [...prev, currentSong]);
                    setCurrentSong(firstSong);
                    setIsPlaying(true);
                    return;
                } else if (originalContext.type === 'single') {
                    // Loop Single Song (Same as Repeat One effectively for single context)
                    if (currentSong) {
                        if (audioRef.current) {
                            // HMR Ghost Check: If stale Audio element matches, ignore it
                            if (audioRef.current instanceof HTMLElement) return;
                            audioRef.current.currentTime = 0;
                            audioRef.current.play();
                        }
                        return;
                    }
                }
            }

            // If checking history or just default auto-play
            if (repeat === 'all' && history.length > 0 && originalContext.type !== 'playlist') {
                // Fallback if context lost but history exists? 
                // Actually logic above handles 'playlist' type.
                // If random bunch of songs, maybe nothing comes here.
            }

            // Try autoplay recommended as last resort
            if (currentSong) autoPlayRecommended(currentSong);
            else setIsPlaying(false);
        }
    };

    const prevSong = () => {
        // Use optional chaining carefully
        // HMR Ghost Check: If stale Audio element matches, ignore it
        if (audioRef.current && audioRef.current instanceof HTMLElement) return;

        if (audioRef.current && typeof audioRef.current.currentTime === 'number' && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        if (history.length > 0) {
            const previous = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));

            if (currentSong) {
                setQueue(prev => [currentSong, ...prev]);
            }

            setCurrentSong(previous);
            setIsPlaying(true);
        }
    };



    const startRadio = async (artist) => {
        if (!artist) return;
        try {
            const res = await fetch(`${API_URL}/api/radio?artist=${encodeURIComponent(artist)}`);
            const data = await res.json();
            setQueue(data);

        } catch (err) {
            // Radio start failed
        }
    };

    return (
        <MusicContext.Provider value={{
            currentSong,
            isPlaying,
            setIsPlaying,
            isBuffering,
            setIsBuffering,
            queue,
            playlists,
            playSong,
            togglePlay,
            startRadio,
            addToPlaylist,
            nextSong,
            prevSong,
            shuffle,
            toggleShuffle,
            repeat,
            toggleRepeat,
            likedSongs,
            toggleLike,
            user,
            createPlaylist,
            updatePlaylist,
            deletePlaylist,
            removeSongFromPlaylist,
            logout,
            login,
            provideAudioRef
        }}>
            {children}
        </MusicContext.Provider>
    );
};
