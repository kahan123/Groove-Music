const axios = require('axios');

async function checkNet() {
    try {
        console.log("Checking Google...");
        await axios.get("https://google.com");
        console.log("Internet OK");
    } catch (e) {
        console.log("Internet BROKEN:", e.message);
    }
}
checkNet();
