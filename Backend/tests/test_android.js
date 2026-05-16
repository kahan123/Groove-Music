const { Innertube, UniversalCache } = require('youtubei.js');

(async () => {
    try {
        console.log("Creating Innertube...");
        const youtube = await Innertube.create({
            client_type: 'ANDROID',
            cache: new UniversalCache(false),
            // generate_session_locally: true
        });
        console.log("Innertube created!");

        console.log("Searching...");
        const result = await youtube.search('faded');
        console.log("Search done. Results:", result.videos.length);

    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
})();
