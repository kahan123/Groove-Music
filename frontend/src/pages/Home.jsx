import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play } from 'lucide-react';
import ScrollableSection from '../components/shared/ScrollableSection';
import API_URL from '../services/api';

const Home = () => {
    const { playSong } = useMusic();
    const [shelves, setShelves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/home`)
            .then(res => res.json())
            .then(data => {
                setShelves(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Home Load Error:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="content-scroll">
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-shelf">
                        <div className="skeleton-title"></div>
                        <div className="skeleton-row">
                            {[1, 2, 3, 4, 5].map(j => (
                                <div key={j} className="skeleton-card">
                                    <div className="skeleton-image skeleton"></div>
                                    <div className="skeleton-text skeleton" style={{ width: '80%', height: '14px' }}></div>
                                    <div className="skeleton-text skeleton" style={{ width: '50%', height: '14px' }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="content-scroll">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Welcome Back</h1>
                    <p>Discover the world's best music.</p>
                </div>
            </section>

            {shelves.map((shelf, idx) => (
                <ScrollableSection title={shelf.title} key={idx}>
                    {shelf.songs.map((song) => (
                        <div className="song-card shelf-card" key={song.id} onClick={() => playSong(song)}>
                            <div className="card-image-wrapper">
                                <img src={song.cover} alt="Cover" loading="lazy" />
                                <div className="play-overlay"><Play fill="white" size={32} /></div>
                            </div>
                            <h3>{song.title}</h3>
                            <p>{song.artist}</p>
                        </div>
                    ))}
                </ScrollableSection>
            ))}
        </div>
    );
};

export default Home;
