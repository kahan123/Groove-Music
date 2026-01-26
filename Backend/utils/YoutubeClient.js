const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const yts = require('yt-search');
const fs = require('fs');

class YoutubeClient {
    constructor() {
        // Use the local binary we verified works
        const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
        const binaryPath = path.join(__dirname, '..', binaryName);
        this.ytDlpWrap = new YTDlpWrap(binaryPath);
        console.log("YoutubeClient (yt-dlp) initialized with binary:", binaryPath);
    }

    async init() {
        return;
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
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        console.log("Spawning yt-dlp for:", url);

        try {
            // execStream returns a Readable stream (stdout of the child process)
            const stream = this.ytDlpWrap.execStream([
                url,
                '-f', 'bestaudio', // Force audio
                '-o', '-'          // Output to stdout
            ]);

            // yt-dlp-wrap's execStream has an 'error' event on the returned stream if spawn fails?
            // Actually it returns a ChildProcess-like object or the stdout stream?
            // Checking docs/source: execStream returns the ChildProcess.
            // But we need the stdout stream to pipe.
            // Wait, execStream returns a ReadableStream that IS the stdout properly wrapped?
            // "execStream(args, options, cleaningPromise)" returns "LiveStream" which extends Readable.

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
