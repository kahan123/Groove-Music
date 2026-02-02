const scraper = require('@vreden/youtube_scraper');

async function test() {
    try {
        const response = await scraper.search("Faded Alan Walker");
        console.log("Response Keys:", Object.keys(response));

        // Try standard keys
        const results = response.results || response.data || response.items || [];
        console.log("Extracted Results Length:", results.length);

        if (results.length > 0) {
            const first = results[0];
            console.log("First Item:", first);

            // Use url or link
            const videoUrl = results[0].url;
            console.log("\n2. Testing ytmp4 for:", videoUrl);

            const videoData = await scraper.ytmp4(videoUrl);
            console.log("Video Data Keys:", Object.keys(videoData));
            if (videoData.download) {
                console.log("Download Keys:", Object.keys(videoData.download));
                if (videoData.download.message) console.log("Error Message:", videoData.download.message);
                if (videoData.download.url) console.log("Download URL:", videoData.download.url);
            }
            if (videoData.url) console.log("Top level URL found:", videoData.url);
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}
test();
