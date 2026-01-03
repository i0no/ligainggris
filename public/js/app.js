async function init() {
    console.log("🚀 Dash Init Started");
    const status = document.getElementById('sync-status');

    try {
        // Test if the API is reachable at all
        const sRes = await fetch('/api/football?type=standings');

        if (!sRes.ok) {
            const errorText = await sRes.text();
            throw new Error(`API Error ${sRes.status}: ${errorText}`);
        }

        const standings = await sRes.json();
        console.log("✅ Standings Received:", standings);
        renderStandings(standings.standings[0].table);

        const rRes = await fetch('/api/football?type=results');
        const results = await rRes.json();
        renderResults(results.matches);

        // Fetch Highlights (external API)
        const hRes = await fetch('https://www.scorebat.com/video-api/v3/');
        const highlights = await hRes.json();
        renderHighlights(highlights.response);

        status.innerText = "Sync Active";
        status.style.background = "#00ff85";

    } catch (err) {
        console.error("❌ CRITICAL ERROR:", err.message);
        status.innerText = "Error: Check Console (F12)";
        status.style.background = "#ff005a";

        // Show the error on the screen for easier debugging
        document.body.insertAdjacentHTML('afterbegin',
                                         `<div style="background:red; color:white; padding:10px; text-align:center;">
                                         Debug Info: ${err.message}
                                         </div>`
        );
    }
}
window.onload = init;
