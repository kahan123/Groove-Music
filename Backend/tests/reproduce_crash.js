const axios = require('axios');

async function testSong(songName) {
    try {
        console.log(`Testing /api/song with name=${songName}...`);
        const response = await axios({
            method: 'get',
            url: `http://localhost:3000/api/song?name=${encodeURIComponent(songName)}`,
            responseType: 'stream',
            validateStatus: () => true // Accept all status codes to handle 500s manually
        });

        console.log(`Status: ${response.status}`);

        if (response.status !== 200) {
            let errorData = '';
            response.data.on('data', chunk => errorData += chunk.toString());
            response.data.on('end', () => console.error(`Error Body: ${errorData}`));
            return;
        }

        response.data.on('data', (chunk) => {
            // console.log(`Received chunk of size: ${chunk.length}`);
            // Just get one chunk and destroy to prove it works
            response.data.destroy();
        });

        response.data.on('end', () => {
            console.log('Stream ended');
        });

        response.data.on('error', (err) => {
            console.error('Stream error:', err);
        });

        // Wait a bit for stream to start
        await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
        console.error('Request setup error:', error.message);
    }
}

async function runTests() {
    const songs = ['FADED', 'Shape of You', 'Despacito', 'Blinding Lights'];
    for (const song of songs) {
        await testSong(song);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between requests
    }
}

runTests();
