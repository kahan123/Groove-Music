const { Innertube, UniversalCache } = require('youtubei.js');

(async () => {
    try {
        console.log("Creating Innertube (WEB)...");
        const youtube = await Innertube.create({
            client_type: 'WEB',
            cache: new UniversalCache(false),
            generate_session_locally: true
        });
        console.log("Innertube created!");

        const result = await youtube.search('faded');
        console.log("Search done. Results:", result.videos.length);

    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
})();
