const express = require('express');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const cleanUrl = (url) => url ? url.replace(/\/$/, '') : '';

const CLIENT_URL = cleanUrl(process.env.CLIENT_URL);
const SERVER_URL = cleanUrl(process.env.SERVER_URL) || 'http://localhost:3000';

app.use(cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- JIO SAAVN CLIENT ---
const SAAVN_API = "https://saavn.dev/api"; // Public unofficial API instance

const formatSaavnSong = (song) => {
    if (!song) return null;

    // Find best quality image (500x500)
    let image = song.image ? song.image[song.image.length - 1].url : '';
    if (Array.isArray(song.image) && song.image.length > 0) {
        // usually the last one is highest quality
        image = song.image[song.image.length - 1].url;
    }

    // Find 320kbps download link if available, else fallback
    let downloadUrl = '';
    if (song.downloadUrl && song.downloadUrl.length > 0) {
        const best = song.downloadUrl.find(d => d.quality === '320kbps') || song.downloadUrl[song.downloadUrl.length - 1];
        downloadUrl = best.url;
    }

    return {
        id: song.id,
        title: song.name,
        artist: song.primaryArtists || (song.artists && song.artists.primary ? song.artists.primary.map(a => a.name).join(', ') : ''),
        album: song.album ? song.album.name : '',
        duration: song.duration ? parseInt(song.duration) * 1000 : 0, // ensure ms
        cover: image,
        url: downloadUrl, // Direct streaming link
        hasLyrics: song.hasLyrics === 'true'
    };
};

// --- API ROUTES ---

// 1. Search (Songs)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).send("Query 'q' is required");

    try {
        const response = await axios.get(`${SAAVN_API}/search/songs?query=${encodeURIComponent(query)}&limit=20`);
        const results = (response.data.data.results || []).map(formatSaavnSong).filter(s => s);
        res.json(results);
    } catch (err) {
        console.error("Search Error:", err.message);
        res.status(500).json({ error: "Failed to search" });
    }
});

// 2. Home (Categories)
app.get('/api/home', async (req, res) => {
    try {
        // Saavn has playlists/modules we can map to categories
        // Or we can simulate categories by specific search queries or playlist IDs
        // For simplicity, let's stick to our reliable search queries for now
        const categories = [
            { title: "Top Hits 🌎", query: "top hits 2024" },
            { title: "Hip-Hop Essentials 🎤", query: "hip hop" },
            { title: "Workout Energy 💪", query: "workout" },
            { title: "Chill Vibes ☁️", query: "lofi" },
            { title: "Rock Classics 🎸", query: "rock classics" }
        ];

        const promises = categories.map(async (cat) => {
            try {
                const response = await axios.get(`${SAAVN_API}/search/songs?query=${encodeURIComponent(cat.query)}&limit=10`);
                return {
                    title: cat.title,
                    songs: (response.data.data.results || []).map(formatSaavnSong).filter(s => s)
                };
            } catch (e) {
                return null;
            }
        });

        const shelves = (await Promise.all(promises)).filter(s => s && s.songs.length > 0);
        res.json(shelves);

    } catch (err) {
        console.error("Home Error:", err.message);
        res.status(500).json({ error: "Failed to load home" });
    }
});

// 3. Play/Stream (Get direct link or proxy)
app.get('/api/song', async (req, res) => {
    const songId = req.query.id; // Expecting Saavn ID now
    const songName = req.query.name; // Fallback for old requests

    try {
        let downloadUrl = null;

        if (songId) {
            // Fetch content by ID to get fresh link
            const response = await axios.get(`${SAAVN_API}/songs/${songId}`);
            const songData = response.data.data[0];
            const song = formatSaavnSong(songData);
            if (song) downloadUrl = song.url;
        } else if (songName) {
            // legacy search fallback
            const response = await axios.get(`${SAAVN_API}/search/songs?query=${encodeURIComponent(songName)}&limit=1`);
            if (response.data.data.results.length > 0) {
                const song = formatSaavnSong(response.data.data.results[0]);
                // We need to get full details to get the high quality link sometimes? 
                // Actually search results usually have it.
                downloadUrl = song.url;
            }
        }

        if (!downloadUrl) return res.status(404).send("Song not found");

        // Proxy the stream to avoid CORS/Referer issues (Saavn links expire and might check headers)
        // Note: Direct redirect `res.redirect(downloadUrl)` is faster but might fail if Saavn blocks it.
        // Let's try direct proxying for reliability.

        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream'
        });

        res.setHeader('Content-Type', 'audio/mp4'); // Saavn usually sends m4a/mp4 (aac)
        response.data.pipe(res);

    } catch (err) {
        console.error("Stream Error:", err.message);
        res.status(500).send("Error fetching stream");
    }
});

// 4. Recommend (Similar Songs)
app.get('/api/recommend', async (req, res) => {
    const { id } = req.query; // Saavn ID of current song

    try {
        // If we have an ID, Saavn has a recommendation API station
        // But the simplest is to search for the song again and get the station ID or "similar songs"
        // The unofficial API often exposes song recommendations via song details

        // Strategy: Search generic or use available endpoint
        // Let's use a "Trending" or "New" list as fallback if no ID, or search similar

        let endpoint = `${SAAVN_API}/modules?language=english`;
        if (id) {
            endpoint = `${SAAVN_API}/songs/${id}/suggestions?limit=15`;
        }

        const response = await axios.get(endpoint);

        // Response structure varies:
        // For suggestions: data: [ { ...song } ]
        // For modules: data: { trending: { songs: [...] } }

        let songs = [];
        if (id && Array.isArray(response.data.data)) {
            songs = response.data.data.map(formatSaavnSong);
        } else if (response.data.data.trending && response.data.data.trending.songs) {
            songs = response.data.data.trending.songs.map(formatSaavnSong);
        }

        res.json(songs.filter(Boolean).slice(0, 15));

    } catch (err) {
        console.error("Rec Error:", err.message);
        res.status(500).json([]); // valid empty result
    }
});

// 5. Radio
app.get('/api/radio', async (req, res) => {
    const artist = req.query.artist;
    if (!artist) return res.status(400).send("Artist required");

    try {
        // Search for artist songs
        const response = await axios.get(`${SAAVN_API}/search/songs?query=${encodeURIComponent(artist)}&limit=25`);
        const songs = (response.data.data.results || []).map(formatSaavnSong).filter(Boolean);

        // Shuffle available songs
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        res.json(songs);

    } catch (e) {
        res.status(500).json([]);
    }
});


// MONGO & AUTH (Unchanged)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/groove')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');
const User = require('./models/User');

app.set('trust proxy', true);

const isProduction = process.env.NODE_ENV === 'production' || (CLIENT_URL && !CLIENT_URL.includes('localhost'));

app.use(cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY],
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    httpOnly: true,
}));

// Session Fix
app.use(function (req, res, next) {
    if (req.session && !req.session.regenerate) req.session.regenerate = (cb) => cb();
    if (req.session && !req.session.save) req.session.save = (cb) => cb();
    next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id).then(user => done(null, user)));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    const existingUser = await User.findOne({ googleId: profile.id });
    const avatarUrl = (profile.photos && profile.photos.length > 0) ? profile.photos[0].value : null;

    if (existingUser) {
        if (existingUser.avatar !== avatarUrl) {
            existingUser.avatar = avatarUrl;
            await existingUser.save();
        }
        return done(null, existingUser);
    }
    const user = await new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        displayName: profile.displayName,
        avatar: avatarUrl
    }).save();
    done(null, user);
}));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => res.redirect(CLIENT_URL)
);

app.get('/api/current_user', (req, res) => res.send(req.user));
app.get('/api/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect(CLIENT_URL);
    });
});

app.post('/api/likes', async (req, res) => {
    if (!req.user) return res.status(401).send('Login required');
    const { song } = req.body;
    const user = await User.findById(req.user.id);

    const index = user.likedSongs.findIndex(s => s.videoId === song.id);
    if (index > -1) {
        user.likedSongs.splice(index, 1);
    } else {
        user.likedSongs.push({
            videoId: song.id, // Using same schema field 'videoId' for Saavn ID
            title: song.title,
            artist: song.artist,
            cover: song.cover
        });
    }
    await user.save();
    res.json(user);
});

app.post('/api/playlists', async (req, res) => {
    if (!req.user) return res.status(401).send('Login required');
    let { name } = req.body;
    const user = await User.findById(req.user.id);
    let finalName = name;
    let counter = 1;
    while (user.playlists.some(p => p.name === finalName)) {
        finalName = `${name} (${counter})`;
        counter++;
    }
    user.playlists.push({ name: finalName, songs: [] });
    await user.save();
    res.json(user);
});

app.post('/api/playlists/add', async (req, res) => {
    if (!req.user) return res.status(401).send('Login required');
    const { playlistId, song } = req.body;
    const user = await User.findById(req.user.id);
    const playlist = user.playlists.id(playlistId);
    if (playlist) {
        const exists = playlist.songs.find(s => s.videoId === song.id);
        if (exists) return res.status(400).send("Song already in playlist");
        playlist.songs.push({
            videoId: song.id,
            title: song.title,
            artist: song.artist,
            cover: song.cover
        });
        await user.save();
    }
    res.json(user);
});

app.delete('/api/playlists/:playlistId/songs/:songId', async (req, res) => {
    if (!req.user) return res.status(401).send('Login required');
    const { playlistId, songId } = req.params;
    try {
        const user = await User.findById(req.user.id);
        const playlist = user.playlists.id(playlistId);
        if (playlist) {
            playlist.songs = playlist.songs.filter(s => s.videoId !== songId);
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

app.put('/api/playlists/:id', async (req, res) => {
    if (!req.user) return res.status(401).send('Login required');
    let { name } = req.body;
    const user = await User.findById(req.user.id);
    const playlist = user.playlists.id(req.params.id);
    if (playlist && playlist.name !== name) {
        let finalName = name;
        let counter = 1;
        while (user.playlists.some(p => p.name === finalName)) {
            finalName = `${name} (${counter})`;
            counter++;
        }
        playlist.name = finalName;
        await user.save();
    }
    res.json(user);
});

app.delete('/api/playlists/:id', async (req, res) => {
    if (!req.user) return res.status(401).send('Login required');
    try {
        const user = await User.findById(req.user.id);
        const playlist = user.playlists.id(req.params.id);
        if (playlist) {
            user.playlists.pull(req.params.id);
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
