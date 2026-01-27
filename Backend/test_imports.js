const pkg = require('youtubei.js');
console.log('Innertube type:', typeof pkg.Innertube);
console.log('UniversalCache type:', typeof pkg.UniversalCache);
console.log('Utils type:', typeof pkg.Utils);

try {
    const cache = new pkg.UniversalCache(false);
    console.log('Cache created:', !!cache);
} catch (e) {
    console.error('Cache creation failed:', e.message);
}
