const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.COOKIE_KEY);
                const user = await User.findById(decoded.id);
                if (user) req.user = user;
            } catch (e) {
                console.error("JWT Error:", e.message);
            }
        }
    }
    next();
};

const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send('Login required');
    }
    next();
};

module.exports = { auth, requireAuth };
