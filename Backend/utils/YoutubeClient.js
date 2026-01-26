const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const yts = require('yt-search');
const fs = require('fs');
const axios = require('axios');

class YoutubeClient {
    constructor() {
        this.ytDlpWrap = null;
        this.initialized = false;
        this.initPromise = null;
    }

    async init() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                let binaryPath;

                if (process.platform === 'win32') {
                    // Start in Backend folder
                    binaryPath = path.join(__dirname, '..', 'yt-dlp.exe');
                    if (!fs.existsSync(binaryPath)) {
                        throw new Error(`Local Windows binary not found at ${binaryPath}`);
                    }
                } else {
                    // Linux / Vercel
                    // Use /tmp as it's the only writable place in Vercel
                    const binaryName = 'yt-dlp_linux';
                    binaryPath = path.join('/tmp', binaryName);

                    if (!fs.existsSync(binaryPath)) {
                        console.log(`[Linux] Downloading yt-dlp to ${binaryPath}...`);
                        const downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

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

                        console.log('[Linux] Download complete.');
                        fs.chmodSync(binaryPath, '755'); // Make executable
                    }
                }

                this.ytDlpWrap = new YTDlpWrap(binaryPath);
                this.initialized = true;
                console.log("YoutubeClient initialized with binary:", binaryPath);

            } catch (error) {
                console.error("YoutubeClient init failed:", error);
                this.initialized = false;
                throw error;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    async search(query) {
        try {
            const r = await yts(query);
            return r.videos;
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    async getStream(videoId) {
        // Ensure initialized
        if (!this.initialized) {
            console.log("Lazy initializing YoutubeClient...");
            await this.init();
        }

        const url = `https://www.youtube.com/watch?v=${videoId}`;
        console.log("Spawning yt-dlp for:", url);

        try {
            const stream = this.ytDlpWrap.execStream([
                url,
                '-f', 'bestaudio',
                '-o', '-'
            ]);

            return {
                stream,
                title: 'Stream',
                contentLength: null
            };
        } catch (error) {
            console.error('Stream spawn failed:', error);
            throw error;
        }
    }
}

module.exports = new YoutubeClient();
