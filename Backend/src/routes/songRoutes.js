const express = require('express');
const router = express.Router();
const YouTube = require('../services/YoutubeClient');
const iTunesService = require('../services/iTunesService');
const ytDlpService = require('../services/ytDlpService');

// Search Endpoint
router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).send("Query 'q' is required");

    try {
        const results = await iTunesService.searchMusic(query);
        res.json(results);
    } catch (err) {
        console.error("Search Error:", err.message);
        res.status(500).json({ error: "Failed to search" });
    }
});

// Home Endpoint
router.get('/home', async (req, res) => {
    try {
        const categories = [
            { title: "Top Hits 🌎", query: "top hits 2024" },
            { title: "Hip-Hop Essentials 🎤", query: "hip hop hits" },
            { title: "Workout Energy 💪", query: "workout music" },
            { title: "Chill Vibes ☁️", query: "lofi chill" },
            { title: "Rock Classics 🎸", query: "best rock songs" }
        ];

        const promises = categories.map(async (cat) => {
            try {
                const songs = await iTunesService.searchMusic(cat.query, 10);
                return { title: cat.title, songs };
            } catch (e) {
                console.error(`Failed to load category ${cat.title}`);
                return null;
            }
        });

        const shelves = (await Promise.all(promises)).filter(s => s !== null);
        res.json(shelves);
    } catch (err) {
        console.error("Home Error:", err);
        res.status(500).json({ error: "Failed to load home" });
    }
});

// Recommend Endpoint
router.get('/recommend', async (req, res) => {
    const { genre, artist, title, trackId } = req.query;
    let searchTerm = genre;

    try {
        if (!searchTerm && (title || artist)) {
            try {
                const query = title ? `${title} ${artist}` : artist;
                const results = await iTunesService.searchMusic(query, 1);
                if (results.length > 0) {
                    searchTerm = results[0].genre;
                }
            } catch (e) {
                console.error("Genre lookup failed:", e.message);
            }
        }

        if (!searchTerm) searchTerm = 'top hits';

        let songs = await iTunesService.getRecommendations(searchTerm);

        if (trackId) {
            songs = songs.filter(s => String(s.id) !== String(trackId));
        }
        if (title) {
            songs = songs.filter(s => s.title.toLowerCase() !== title.toLowerCase());
        }

        // Shuffle
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }

        res.json(songs.slice(0, 15));
    } catch (err) {
        console.error("Recommendation Error:", err.message);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
});

// Radio Endpoint
router.get('/radio', async (req, res) => {
    const artist = req.query.artist;
    if (!artist) return res.status(400).send("Query 'artist' is required");

    try {
        const songs = await iTunesService.searchMusic(artist, 25);
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        res.json(songs);
    } catch (err) {
        console.error("Radio Error:", err.message);
        res.status(500).json({ error: "Failed to generate radio" });
    }
});

// Stream Endpoint
router.get('/song', async (req, res) => {
    const songName = req.query.name;
    if (!songName) return res.status(400).send("Name parameter required");

    try {
        const videos = await YouTube.search(songName);
        if (!videos || videos.length === 0) return res.status(404).json({ error: "Song not found" });

        const video = videos[0];
        const url = `https://www.youtube.com/watch?v=${video.videoId}`;
        
        res.setHeader('Content-Type', 'audio/mpeg');
        const dlpStream = await ytDlpService.getStream(url);
        dlpStream.pipe(res);

        dlpStream.on('error', (err) => {
            console.error("❌ Stream Error:", err.message);
            if (!res.headersSent) res.status(500).send("Stream failed");
            else res.end();
        });
    } catch (err) {
        console.error('Song Error:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

module.exports = router;
