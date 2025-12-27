import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useToast } from './ToastContext';

const MusicContext = createContext();

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
    const { success, error, info } = useToast();
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [queue, setQueue] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const audioRef = useRef(new Audio());

    const [shuffle, setShuffle] = useState(false);
    const [user, setUser] = useState(null);
    const [repeat, setRepeat] = useState('off'); // 'off', 'one', 'all'
    const [history, setHistory] = useState([]);
    const [likedSongs, setLikedSongs] = useState([]);
    const [originalContext, setOriginalContext] = useState({ type: 'single', songs: [] });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Ensure credentials are sent to get the cookie
                const res = await fetch(`${API_URL}/api/current_user`, {
                    credentials: 'include'
                });

                if (res.status === 401 || res.status === 403) {
                    // Not logged in, this is expected behavior for guests
                    return;
                }

                // Check for empty response before parsing JSON
                const text = await res.text();
                if (!text) {
                    // Empty response, treat as not logged in or no user data
                    return;
                }

                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error("Failed to parse user data:", e);
                    return; // If parsing fails, stop here
                }

                if (!res.ok) {
                    throw new Error(`Auth check failed: ${res.status}`);
                }
                if (data && data.googleId) {
                    setUser(data);
                    // Sync initial state
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
                }
            } catch (err) {
                // Only log actual network/server errors, not auth failures
                console.error("Failed to fetch user session:", err);
            }
        };
        fetchUser();
    }, []);

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
            const res = await fetch(`${API_URL}/api/likes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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
            console.error("Like failed", err);
            // Revert? For now assume success or user refresh handles it
        }
    };

    const createPlaylist = async (name) => {
        if (!user) return null;
        try {
            const res = await fetch(`${API_URL}/api/playlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name })
            });
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success(`Created playlist "${name}"`);
            // Return the new playlist ID (last one)
            return updatedUser.playlists[updatedUser.playlists.length - 1]._id;
        } catch (err) {
            console.error("Create playlist failed", err);
            error("Failed to create playlist");
            return null;
        }
    };

    const updatePlaylist = async (id, name) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/api/playlists/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name })
            });
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success("Playlist updated");
        } catch (err) {
            console.error("Update playlist failed", err);
            error("Failed to update playlist");
        }
    };

    const addToPlaylist = async (playlistId, song) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/api/playlists/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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
            console.error("Add to playlist failed", err);
            error(err.message || "Failed to add to playlist");
        }
    };

    const removeSongFromPlaylist = async (playlistId, songId) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/api/playlists/${playlistId}/songs/${songId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!res.ok) throw new Error("Failed to remove song");
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success("Song removed from playlist");
        } catch (err) {
            console.error("Remove song failed", err);
            error("Failed to remove song");
        }
    };

    const deletePlaylist = async (id) => {
        if (!user) return;
        try {

            const res = await fetch(`${API_URL}/api/playlists/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!res.ok) {
                const text = await res.text();
                console.error(`Delete failed: ${res.status} ${text}`);
                throw new Error(text || 'Delete failed');
            }
            const updatedUser = await res.json();
            setUser(updatedUser);
            setPlaylists(updatedUser.playlists);
            success("Playlist deleted");
        } catch (err) {
            console.error("Delete playlist failed", err);
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
            let url = `${API_URL}/recommend?trackId=${current.id}&title=${encodeURIComponent(current.title)}&artist=${encodeURIComponent(current.artist)}`;
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
            console.error("Autoplay failed", err);
        }
    };

    const nextSong = () => {
        if (repeat === 'one') {
            if (audioRef.current) {
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
        if (audioRef.current && audioRef.current.currentTime > 3) {
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
            const res = await fetch(`${API_URL}/radio?artist=${encodeURIComponent(artist)}`);
            const data = await res.json();
            setQueue(data);

        } catch (err) {
            console.error("Radio start failed", err);
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
            removeSongFromPlaylist
        }}>
            {children}
        </MusicContext.Provider>
    );
};
