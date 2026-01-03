exports.handler = async (event) => {
    // Get the type from query params (standings, results, or highlights)
    const type = event.queryStringParameters.type || 'standings';
    const API_KEY = process.env.FOOTBALL_API_KEY;

    // Set endpoints
    const ENDPOINTS = {
        standings: 'https://api.football-data.org/v4/competitions/PL/standings',
        results: 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED&limit=12',
        highlights: 'https://www.scorebat.com/video-api/v3/'
    };

    try {
        const url = ENDPOINTS[type];

        // Only add the Football-Data key if we aren't fetching highlights
        const headers = {};
        if (type !== 'highlights') {
            headers['X-Auth-Token'] = API_KEY;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Upstream responded with ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=300"
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Function Error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
