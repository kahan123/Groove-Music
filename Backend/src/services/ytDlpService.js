const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const SystemConfig = require('../models/SystemConfig');

let ytDlpPath = 'python';
try {
    execSync('python3 --version', { stdio: 'ignore' });
    ytDlpPath = 'python3';
} catch (e) {
    // keep 'python'
}

console.log(`Using python executable: ${ytDlpPath}`);
const ytDlpWrap = new YTDlpWrap(ytDlpPath);

const ensureBinary = async () => {
    try {
        const version = execSync(`${ytDlpPath} -m yt_dlp --version`).toString().trim();
        console.log(`✅ yt-dlp module found! Version: ${version}`);
    } catch (e) {
        console.error("❌ yt-dlp module check failed:", e.message);
    }
};

const getCookiesPath = async () => {
    try {
        const config = await SystemConfig.findOne({ key: 'youtube_cookies' });
        if (config && config.value) {
            const cookiesPath = process.platform === 'win32'
                ? path.join(__dirname, '../../cookies.txt')
                : path.join('/tmp', 'cookies.txt');

            const cookieContent = Buffer.from(config.value, 'base64').toString('utf-8');
            fs.writeFileSync(cookiesPath, cookieContent);
            return cookiesPath;
        }
    } catch (e) {
        console.error("Failed to fetch cookies from DB:", e.message);
    }
    return null;
};

const getStream = async (url) => {
    const args = [
        '-m', 'yt_dlp',
        url,
        '--impersonate', 'chrome',
        '-f', '140/251/bestaudio',
        '-o', '-'
    ];

    const cookiesPath = await getCookiesPath();
    if (cookiesPath) {
        args.push('--cookies', cookiesPath);
    }

    return ytDlpWrap.execStream(args);
};

module.exports = {
    ensureBinary,
    getStream
};
