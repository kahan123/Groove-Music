const YouTube = require('./utils/YoutubeClient');

async function testSearch(query) {
    try {
        console.log("Initializing...");
        await YouTube.init();
        console.log("Init done.");

        console.log(`Searching for: "${query}"...`);
        const results = await YouTube.search(query);

        if (results && results.length > 0) {
            console.log(`✅ Search Success! Found ${results.length} results.`);
            console.log("First Result:", JSON.stringify(results[0], null, 2));
        } else {
            console.error("❌ Search failed: No results found.");
        }
    } catch (err) {
        console.error("❌ Test Failed:", err);
    }
}

// Check if a query was provided as an argument
const query = process.argv[2] || "Faded Alan Walker";
testSearch(query);
