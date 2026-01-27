const { Innertube, UniversalCache, Utils } = require('youtubei.js');

class YoutubeClient {
    constructor() {
        this.innertube = null;
        this.initPromise = null;
    }

    async init() {
        if (this.innertube) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                this.innertube = await Innertube.create({
                    client_type: 'WEB', // ANDROID fails in CJS with ParsingError, WEB works
                    cache: new UniversalCache(false),
                    generate_session_locally: true
                });
                console.log("YoutubeClient (InnerTube WEB) initialized");
            } catch (error) {
                console.error("YoutubeClient init failed:", error);
                this.innertube = null;
                throw error;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    async search(query) {
        if (!this.innertube) await this.init();
        try {
            console.log("Searching for:", query);
            const result = await this.innertube.search(query);

            // InnerTube search results structure processing
            const videos = result.videos || result.results?.filter(item => item.type === 'Video') || [];

            return videos.map(v => ({
                videoId: v.id,
                title: v.title?.text || v.title?.toString() || 'Unknown Title',
                duration: v.duration?.seconds || 0,
                thumbnail: v.thumbnails?.[0]?.url || '',
                author: v.author?.name || v.author?.toString() || 'Unknown Artist'
            }));
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    // Deprecated: Client-side streaming is now used
    async getStream(videoId) {
        throw new Error("Server-side streaming is deprecated. Use client-side IFrame.");
    }
}

module.exports = new YoutubeClient();
