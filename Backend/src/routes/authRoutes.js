const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const googleId = payload.sub;

        let user = await User.findOne({ googleId });
        if (!user) {
            user = await new User({
                googleId,
                email: payload.email,
                displayName: payload.name,
                avatar: payload.picture
            }).save();
        } else if (user.avatar !== payload.picture) {
            user.avatar = payload.picture;
            await user.save();
        }

        const sessionToken = jwt.sign({ id: user._id }, process.env.COOKIE_KEY, { expiresIn: '30d' });
        res.json({ token: sessionToken, user });
    } catch (e) {
        console.error("Auth Fail:", e);
        res.status(401).json({ error: "Authentication failed" });
    }
});

router.get('/current_user', (req, res) => {
    res.send(req.user || null);
});

router.post('/logout', (req, res) => {
    res.send({ status: 'OK' });
});

module.exports = router;
