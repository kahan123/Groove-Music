const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { auth } = require('./middleware/auth');
const songRoutes = require('./routes/songRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const cleanUrl = (url) => url ? url.replace(/\/$/, '') : '';
const CLIENT_URL = cleanUrl(process.env.CLIENT_URL);

app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(auth);

// Debug Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api', songRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);

// Version/Status
app.get('/api/version', (req, res) => res.send({ version: "2.2.0", status: "ok" }));

module.exports = app;
