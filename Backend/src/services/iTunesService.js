const axios = require('axios');

const formatItunesResults = (results) => {
    return results.map(item => ({
        id: item.trackId,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        duration: item.trackTimeMillis,
        cover: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
        genre: item.primaryGenreName
    }));
};

const searchMusic = async (query, limit = 20) => {
    const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${limit}`);
    return formatItunesResults(response.data.results);
};

const getRecommendations = async (searchTerm, limit = 50) => {
    const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=${limit}`);
    return formatItunesResults(response.data.results);
};

module.exports = {
    searchMusic,
    getRecommendations,
    formatItunesResults
};
