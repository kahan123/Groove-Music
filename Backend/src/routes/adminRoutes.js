const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');

router.post('/cookies', async (req, res) => {
    const { secret, cookiesBase64 } = req.body;
    if (secret !== process.env.ADMIN_SECRET) return res.status(403).send("Forbidden");

    try {
        await SystemConfig.findOneAndUpdate(
            { key: 'youtube_cookies' },
            { value: cookiesBase64, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.send("Cookies updated successfully");
    } catch (e) {
        res.status(500).send(e.message);
    }
});

module.exports = router;
