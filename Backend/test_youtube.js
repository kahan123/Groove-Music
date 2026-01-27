const YouTube = require('./utils/YoutubeClient');

async function test() {
    try {
        console.log("Initializing...");
        await YouTube.init();
        console.log("Init done.");

        console.log("1. Testing Search...");
        const results = await YouTube.search("Faded Alan Walker");
        if (results.length > 0) {
            console.log("✅ Search Success! Found:", results[0].title);
            console.log("First Result ID:", results[0].videoId);

            console.log("\n2. Testing Stream for ID:", results[0].videoId);
            const { stream, utils } = await YouTube.getStream(results[0].videoId);

            if (stream) {
                console.log("✅ Stream Success! Stream object received.");
                // Listen to data to ensure it's flowing
                let chunkCount = 0;

                try {
                    for await (const chunk of utils.streamToIterable(stream)) {
                        chunkCount++;
                        if (chunkCount === 1) {
                            console.log("✅ Data is flowing! First chunk received. Size:", chunk.length);
                            break; // Stop after first chunk to succeed test
                        }
                    }
                } catch (err) {
                    console.error("❌ Streaming Error:", err);
                }

            } else {
                console.error("❌ Stream failed: No stream object returned.");
            }

        } else {
            console.error("❌ Search failed: No results found.");
        }
    } catch (err) {
        console.error("❌ Test Failed:");
        console.error(err.message);
        if (err.info) console.error("Info:", err.info);
    }
}

test();
