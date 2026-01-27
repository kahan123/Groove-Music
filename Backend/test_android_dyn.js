(async () => {
    try {
        const { Innertube, UniversalCache } = await import('youtubei.js');
        console.log("Creating Innertube via dynamic import...");
        const youtube = await Innertube.create({
            client_type: 'ANDROID',
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
