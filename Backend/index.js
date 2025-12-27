const express = require('express');
const YTDlpWrap = require('yt-dlp-wrap').default;
const yts = require('yt-search');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const cors = require('cors');

const app = express();
const CLIENT_URL = process.env.CLIENT_URL;

app.use(cors({
    origin: CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Vercel/Linux requires the STANDALONE 
// binary (yt-dlp_linux) because it doesn't have Python installed.
// Only the file named 'yt-dlp' is a Python script script, which fails.
const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp_linux';
const ytDlpWrap = new YTDlpWrap();
const binaryPath = process.platform === 'win32'
    ? path.join(__dirname, binaryName)
    : path.join('/tmp', binaryName);

const cookiePath = process.platform === 'win32'
    ? path.join(__dirname, 'cookies.txt')
    : path.join('/tmp', 'cookies.txt');

const ensureCookies = () => {
    console.log(process.env.YOUTUBE_COOKIES);
    if (process.env.YOUTUBE_COOKIES) {
        // Write the cookies to a file
        fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
        console.log(`Cookies written to ${cookiePath}`);
    } else {
        console.log("No YOUTUBE_COOKIES env var found. YouTube might block requests.");
    }
};

const ensureBinary = async () => {
    // on Vercel/Linux, we might need to redownload if /tmp was cleared (ephemeral)
    if (!fs.existsSync(binaryPath)) {
        console.log(`Downloading yt-dlp binary (${binaryName}) to ${binaryPath}...`);
        try {
            // Manual download to ensure we get exactly the standalone binary
            // bypassing any potential logic errors in the wrapper library
            const downloadUrl = process.platform === 'win32'
                ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
                : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

            const response = await axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(binaryPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log('Downloaded yt-dlp binary successfully');

            // Ensure executable permissions on Linux/Unix
            if (process.platform !== 'win32') {
                fs.chmodSync(binaryPath, '755');
            }
        } catch (err) {
            console.error("Failed to download binary:", err);
            throw err;
        }
    }
    ytDlpWrap.setBinaryPath(binaryPath);
};

const axios = require('axios');


const formatItunesResults = (results) => {
    return results.map(item => ({
        id: item.trackId,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        duration: item.trackTimeMillis,
        cover: item.artworkUrl100.replace('100x100bb', '600x600bb'),
        genre: item.primaryGenreName
    }));
};


app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).send("Query 'q' is required");

    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`);
        const results = formatItunesResults(response.data.results);
        res.json(results);
    } catch (err) {
        console.error("Search Error:", err.message);
        res.status(500).json({ error: "Failed to search" });
    }
});

app.get('/home', async (req, res) => {
    console.log("req recieved")
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
                const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(cat.query)}&media=music&limit=10`);
                return {
                    title: cat.title,
                    songs: formatItunesResults(response.data.results)
                };
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
app.get('/recommend', async (req, res) => {
    const { genre, artist, title, trackId } = req.query;
    let searchTerm = genre;

    try {
        // If no genre provided (e.g. from Liked Songs), try to resolve it from iTunes
        if (!searchTerm && (title || artist)) {
            try {
                const query = title ? `${title} ${artist}` : artist;
                const lookupRes = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`);
                if (lookupRes.data.results.length > 0) {
                    searchTerm = lookupRes.data.results[0].primaryGenreName;
                    console.log(`Resolved genre for "${title}": ${searchTerm}`);
                }
            } catch (e) {
                console.error("Genre lookup failed:", e.message);
            }
        }

        // Fallback
        if (!searchTerm) {
            searchTerm = 'top hits';
        }

        console.log(`Recommending based on: ${searchTerm}`);

        // Search for similar music (mostly by genre)
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=50`);
        let songs = formatItunesResults(response.data.results);

        // Filter out EXACT current track (so we don't repeat immediately), but ALLOW same artist
        if (trackId) {
            songs = songs.filter(s => String(s.id) !== String(trackId));
        }

        // Also filter out songs with exact same title to avoid duplicates/remixes
        if (title) {
            songs = songs.filter(s => s.title.toLowerCase() !== title.toLowerCase());
        }

        // Shuffle the results for randomness
        if (trackId) {
            songs = songs.filter(s => String(s.id) !== String(trackId));
        }

        // Shuffle the results for randomness
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }

        // Return top 15 recommendations
        res.json(songs.slice(0, 15));
    } catch (err) {
        console.error("Recommendation Error:", err.message);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
});

// Radio Endpoint (Artist Mix)
app.get('/radio', async (req, res) => {
    const artist = req.query.artist;
    if (!artist) return res.status(400).send("Query 'artist' is required");

    try {
        // Fetch more songs by this artist (limit 25)
        // We could also mix in similar artists if we had a recommendation API
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&media=music&entity=song&limit=25`);
        const songs = formatItunesResults(response.data.results);

        // Simple Shuffle
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

app.get('/song', async (req, res) => {
    const songName = req.query.name;
    if (!songName) {
        return res.status(400).send("Please provide a song name query parameter 'name'");
    }

    console.log(`Searching for: ${songName}`);

    try {
        await ensureBinary();

        const r = await yts(songName);
        const videos = r.videos;

        if (!videos || videos.length === 0) {
            return res.status(404).send("Song not found");
        }

        const video = videos[0];
        console.log(`Found video: ${video.title} (${video.url})`);

        console.log(`Streaming (yt-dlp): ${video.title}`);

        // Handle HTTP Range Requests (Critical for Vercel/Serverless)
        // YouTube URLs allow range requests, so we can just redirect the client 
        // to the direct URL if we remove the IP check, OR we proxy range-by-range.

        // Strategy: Get the Direct URL using -g and proxy the specific chunk requested by the browser.

        // Ensure cookies exist if provided
        ensureCookies();

        const args = [
            video.url,
            '-g',
            '-f', 'bestaudio',
            '--cookies', cookiePath,
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--js-runtimes', 'node'
        ];

        console.log(`Running yt-dlp with args: ${JSON.stringify(args)}`);

        const directUrl = await ytDlpWrap.execPromise(args);

        if (!directUrl) throw new Error("Failed to get direct URL");

        const range = req.headers.range;
        if (!range) {
            // Requesting the whole file (usually initial probe)
            // We can just pipe the start, but better to proxy simply
            const axios = require('axios');
            const response = await axios({
                method: 'get',
                url: directUrl.trim(),
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            res.setHeader('Content-Type', 'audio/mpeg');
            response.data.pipe(res);
            return;
        }

        // Parse Range (e.g., "bytes=0-")
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        // Chunk size: 1MB per request to stay well within 10s timeout
        const CHUNK_SIZE = 10 ** 6;
        const end = parts[1] ? parseInt(parts[1], 10) : start + CHUNK_SIZE;

        const axios = require('axios');
        try {
            const response = await axios({
                method: 'get',
                url: directUrl.trim(),
                responseType: 'stream',
                headers: {
                    'Range': `bytes=${start}-${end}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            // Pass the Content-Range header back to the client
            res.writeHead(206, {
                'Content-Range': response.headers['content-range'],
                'Accept-Ranges': 'bytes',
                'Content-Length': response.headers['content-length'],
                'Content-Type': 'audio/mpeg',
            });

            response.data.pipe(res);
        } catch (streamErr) {
            console.error("Stream Proxy Error:", streamErr.message);
            res.status(500).end();
        }

    } catch (err) {
        console.error('Search Error:', err);
        if (!res.headersSent) {
            res.status(500).send(`Error processing request: ${err.message}\n${err.stack}`);
        }
    }
});

const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/groove')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');
const User = require('./models/User');

// Cooke Session
app.use(cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    keys: [process.env.COOKIE_KEY]
}));

// Shim for passport 0.6+ compatibility with cookie-session
app.use(function (req, res, next) {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb) => {
            cb();
        };
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb) => {
            cb();
        };
    }
    next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:3000'}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    // Check if user exists
    const existingUser = await User.findOne({ googleId: profile.id });
    const avatarUrl = (profile.photos && profile.photos.length > 0) ? profile.photos[0].value : null;

    console.log("Google Auth Profile:", profile.displayName);
    console.log("Avatar URL found:", avatarUrl);

    if (existingUser) {
        // Update avatar if it changed or was missing
        if (existingUser.avatar !== avatarUrl) {
            existingUser.avatar = avatarUrl;
            await existingUser.save();
        }
        return done(null, existingUser);
    }
    // Create new user
    const user = await new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        displayName: profile.displayName,
        avatar: avatarUrl
    }).save();
    done(null, user);
}));

// Auth Routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback',
    (req, res, next) => {
        console.log("Auth Callback Hit");
        next();
    },
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        console.log("Auth Success, redirecting to:", CLIENT_URL);
        console.log("User:", req.user ? req.user.id : "No User");
        res.redirect(CLIENT_URL); // Redirect to frontend
    }
);

app.get('/api/current_user', (req, res) => {
    res.send(req.user);
});

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

    // Check if song already liked
    const index = user.likedSongs.findIndex(s => s.videoId === song.id);
    if (index > -1) {
        user.likedSongs.splice(index, 1);
    } else {
        user.likedSongs.push({
            videoId: song.id,
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

    // Unique naming logic
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
        // Prevent duplicates
        const exists = playlist.songs.find(s => s.videoId === song.id || s.videoId === song.videoId);
        if (exists) {
            return res.status(400).send("Song already in playlist");
        }

        playlist.songs.push({
            videoId: song.id, // Ensure we use the ID consistently
            title: song.title,
            artist: song.artist,
            cover: song.cover
        });
        await user.save();
    }
    res.json(user);
});

// Remove Song from Playlist
app.delete('/api/playlists/:playlistId/songs/:songId', async (req, res) => {
    if (!req.user) return res.status(401).send('Login required');
    const { playlistId, songId } = req.params;

    try {
        const user = await User.findById(req.user.id);
        const playlist = user.playlists.id(playlistId);

        if (playlist) {
            // Filter out the song
            playlist.songs = playlist.songs.filter(s => s.videoId !== songId);
            await user.save();
        }
        res.json(user);
    } catch (err) {
        console.error("Remove song error", err);
        res.status(500).send("Server error");
    }
});

// Update Playlist (Rename)
app.put('/api/playlists/:id', async (req, res) => {
    if (!req.user) return res.status(401).send('Login required');
    let { name } = req.body;
    const user = await User.findById(req.user.id);

    const playlist = user.playlists.id(req.params.id);
    if (playlist) {
        // Unique naming logic (excluding the current playlist itself if name hasn't changed)
        if (playlist.name !== name) {
            let finalName = name;
            let counter = 1;
            // Check against ALL playlists (to prevent collision with others)
            while (user.playlists.some(p => p.name === finalName)) {
                finalName = `${name} (${counter})`;
                counter++;
            }
            playlist.name = finalName;
        }
        await user.save();
    }
    res.json(user);
});

// Delete Playlist
app.delete('/api/playlists/:id', async (req, res) => {
    console.log(`[DELETE] Request for playlist ${req.params.id}`);
    if (!req.user) {
        console.log('[DELETE] No user in request');
        return res.status(401).send('Login required');
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('[DELETE] User not found in DB');
            return res.status(404).send('User not found');
        }

        // Mongoose Subdocument Array .pull()
        // Check if playlist exists first
        const playlist = user.playlists.id(req.params.id);
        if (playlist) {
            console.log(`[DELETE] Removing playlist: ${playlist.name}`);
            user.playlists.pull(req.params.id);
            await user.save();
            console.log('[DELETE] Success');
        } else {
            console.log('[DELETE] Playlist not found in user document');
        }
        res.json(user);
    } catch (err) {
        console.error('[DELETE] Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
