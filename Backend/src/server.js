const app = require('./app');
const connectDB = require('./config/db');
const YouTube = require('./services/YoutubeClient');
const ytDlpService = require('./services/ytDlpService');

const path = require('path');

// Set PYTHONPATH to include local py_libs
const pyLibsPath = path.join(__dirname, '../py_libs');
if (process.env.PYTHONPATH) {
    process.env.PYTHONPATH = pyLibsPath + path.delimiter + process.env.PYTHONPATH;
} else {
    process.env.PYTHONPATH = pyLibsPath;
}
console.log(`Updated PYTHONPATH: ${process.env.PYTHONPATH}`);

const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Initialize Services
YouTube.init()
    .then(() => console.log("✅ YouTube Client Initialized"))
    .catch(err => console.error("❌ YouTube Client Init Failed:", err));

ytDlpService.ensureBinary();

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
