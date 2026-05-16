import React from 'react';

const Explore = ({ onSearch, setView }) => {
    const browseCategories = [
        { title: 'Pop', color: 'rgb(255, 0, 100)' },
        { title: 'Hip-Hop', color: 'rgb(220, 20, 140)' },
        { title: 'Rock', color: 'rgb(230, 30, 50)' },
        { title: 'Indie', color: 'rgb(13, 114, 234)' },
        { title: 'RB', color: 'rgb(186, 93, 7)' },
        { title: 'Workout', color: 'rgb(141, 103, 171)' },
    ];

    return (
        <div className="content-scroll">
            <div className="hero-section" style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800' }}>Explore</h1>
                <p style={{ color: '#b3b3b3' }}>Find your new favorite sound.</p>
            </div>

            <section>
                <div className="browse-grid">
                    {browseCategories.map((cat, i) => (
                        <div
                            key={i}
                            className="browse-card"
                            style={{ backgroundColor: cat.color }}
                            onClick={() => {
                                onSearch(cat.title);
                                setView('search');
                            }}
                        >
                            <h3>{cat.title}</h3>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Explore;
