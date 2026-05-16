const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // 🔐 Google Auth Data
    googleId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayName: String,
    avatar: String,

    // 🎵 Library Data
    likedSongs: [{
        videoId: String,
        title: String,
        artist: String,
        cover: String,
        addedAt: { type: Date, default: Date.now }
    }],

    playlists: [{
        name: String,
        cover: String,
        songs: [{
            videoId: String,
            title: String,
            artist: String,
            cover: String
        }],
        createdAt: { type: Date, default: Date.now }
    }],

    history: [{
        videoId: String,
        title: String,
        artist: String,
        playedAt: { type: Date, default: Date.now }
    }],

    // ⚙️ Account Meta
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date
});

module.exports = mongoose.model('User', UserSchema);
