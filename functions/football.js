/**
 * Backend Function: football.js
 * Handles fetching Standings, Results, Fixtures, and Official Highlights.
 */

exports.handler = async (event) => {
    // 1. Setup Configuration
    const type = event.queryStringParameters.type || 'standings';
    const queryParam = event.queryStringParameters.q;
    const API_KEY = process.env.FOOTBALL_API_KEY; // api.football-data.org key
    const YT_KEY = process.env.YOUTUBE_API_KEY;   // Google Cloud YouTube v3 key

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        // --- HIGHLIGHTS LOGIC (Official Search) ---
        if (type === 'highlights') {
            // Refined search: adds "official highlights" and excludes "shorts"
            // We use videoDuration=medium to prioritize 4-10 minute highlight reels
            const term = encodeURIComponent(`${queryParam} official highlights`);
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=relevance&type=video&videoDuration=medium&q=${term}&key=${YT_KEY}`;

            const ytRes = await fetch(ytUrl);
            const ytData = await ytRes.json();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(ytData.items || [])
            };
        }

        // --- FOOTBALL DATA LOGIC (Standings, Results, Fixtures) ---
        const ENDPOINTS = {
            standings: 'https://api.football-data.org/v4/competitions/PL/standings',
            results: 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED',
            fixtures: 'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED'
        };

        const targetUrl = ENDPOINTS[type];
        if (!targetUrl) throw new Error("Invalid request type");

        const response = await fetch(targetUrl, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { statusCode: response.status, headers, body: errorText };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Backend Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
