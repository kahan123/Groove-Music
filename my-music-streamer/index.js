const express = require('express');
const fs = require('fs');
const path = require('path');
const YTDlpWrap = require('yt-dlp-wrap').default;

const app = express();
const PORT = 3001;

const CACHE_DIR = path.join(__dirname, 'songs');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

// Detect OS: If Windows, add .exe. If Linux, no extension.
const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const ytDlpPath = path.join(__dirname, binaryName);

const ytDlpWrap = new YTDlpWrap(ytDlpPath);

async function ensureBinary() {
    if (!fs.existsSync(ytDlpPath)) {
        console.log("⬇️  Downloading yt-dlp binary...");
        await YTDlpWrap.downloadFromGithub(ytDlpPath);
        
        // CRITICAL FOR LINUX: Give it execute permissions
        if (process.platform !== 'win32') {
            fs.chmodSync(ytDlpPath, '755');
        }
        console.log("✅ yt-dlp installed and executable!");
    }
}


app.get('/', (req, res) => res.send('Embedded Proxy Running.'));

app.get('/stream/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    // We use .audio extension to accept either m4a or webm
    const filePath = path.join(CACHE_DIR, `${videoId}.audio`);

    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.size > 0) {
            console.log(`💿 Serving from Cache: ${videoId}`);
            res.writeHead(200, {
                'Content-Type': 'audio/mpeg', 
                'Content-Length': stat.size
            });
            return fs.createReadStream(filePath).pipe(res);
        }
        fs.unlinkSync(filePath);
    }

    console.log(`☁️  Fetching (Embedded Client): ${videoId}`);
    
    try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const writeStream = fs.createWriteStream(filePath);
        
        let dlpStream = ytDlpWrap.execStream([
            url,
            '--js-runtime', 'node', // Keep Node runtime
            
            // TRICK: Pretend to be an embedded player
            '--extractor-args', 'youtube:player_client=web_embedded',
            
            // RELAX FORMAT: Accept m4a (140) OR webm (251)
            // Both are standalone audio files that don't need FFmpeg to merge
            '-f', '140/251/bestaudio',
            
            '-o', '-'
        ]);

        res.setHeader('Content-Type', 'audio/mpeg');

        dlpStream.pipe(writeStream);
        dlpStream.pipe(res);

        dlpStream.on('error', (err) => {
            console.error("❌ yt-dlp Error:", err.message);
            writeStream.end();
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

    } catch (error) {
        res.status(500).send("Stream failed");
    }
});

ensureBinary().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});