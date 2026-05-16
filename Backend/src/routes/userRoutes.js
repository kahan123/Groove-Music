const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Likes
router.post('/likes', async (req, res) => {
    const { song } = req.body;
    const user = await User.findById(req.user.id);
    const index = user.likedSongs.findIndex(s => s.videoId === song.id);
    
    if (index > -1) user.likedSongs.splice(index, 1);
    else user.likedSongs.push({
        videoId: song.id,
        title: song.title,
        artist: song.artist,
        cover: song.cover
    });
    
    await user.save();
    res.json(user);
});

// Playlists
router.post('/playlists', async (req, res) => {
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

router.post('/playlists/add', async (req, res) => {
    const { playlistId, song } = req.body;
    const user = await User.findById(req.user.id);
    const playlist = user.playlists.id(playlistId);
    if (playlist) {
        const exists = playlist.songs.find(s => s.videoId === song.id || s.videoId === song.videoId);
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

router.delete('/playlists/:playlistId/songs/:songId', async (req, res) => {
    const { playlistId, songId } = req.params;
    const user = await User.findById(req.user.id);
    const playlist = user.playlists.id(playlistId);
    if (playlist) {
        playlist.songs = playlist.songs.filter(s => s.videoId !== songId);
        await user.save();
    }
    res.json(user);
});

router.put('/playlists/:id', async (req, res) => {
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

router.delete('/playlists/:id', async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user) {
        user.playlists.pull(req.params.id);
        await user.save();
    }
    res.json(user);
});

module.exports = router;
