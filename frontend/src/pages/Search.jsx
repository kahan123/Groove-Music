import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play } from 'lucide-react';
import API_URL from '../services/api';

const Search = ({ initialTerm = '' }) => {
    const { playSong } = useMusic();
    const [searchTerm, setSearchTerm] = useState(initialTerm);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const performSearch = async (term) => {
        if (!term.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(term)}`);
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error("Search Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialTerm) {
            setSearchTerm(initialTerm);
            performSearch(initialTerm);
        }
    }, [initialTerm]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim()) performSearch(searchTerm);
        }, 600);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    return (
        <div className="content-scroll">
            <div className="search-header" style={{ marginBottom: '40px' }}>
                <input
                    type="text"
                    className="big-search-input"
                    placeholder="What do you want to listen to?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
                    autoFocus
                />
            </div>

            {loading ? (
                <div className="card-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton-image skeleton"></div>
                            <div className="skeleton-text skeleton" style={{ width: '80%', height: '14px' }}></div>
                            <div className="skeleton-text skeleton" style={{ width: '50%', height: '14px' }}></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card-grid">
                    {results.map((song) => (
                        <div className="song-card" key={song.id} onClick={() => playSong(song)}>
                            <div className="card-image-wrapper">
                                <img src={song.cover} alt="Cover" />
                                <div className="play-overlay"><Play fill="white" size={32} /></div>
                            </div>
                            <h3>{song.title}</h3>
                            <p>{song.artist}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Search;
