exports.handler = async (event) => {
    const type = event.queryStringParameters.type || 'standings';
    const queryParam = event.queryStringParameters.q;
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const YT_KEY = process.env.YOUTUBE_API_KEY;

    try {
        // YouTube Logic: Fetches specific match highlights based on team names
        if (type === 'highlights') {
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=relevance&type=video&q=${encodeURIComponent(queryParam)}&key=${YT_KEY}`;
            const res = await fetch(ytUrl);
            const ytData = await res.json();
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ytData.items || [])
            };
        }

        // Football-Data Logic
        const ENDPOINTS = {
            standings: 'https://api.football-data.org/v4/competitions/PL/standings',
            results: 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED',
            fixtures: 'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED'
        };

        const res = await fetch(ENDPOINTS[type], { headers: { 'X-Auth-Token': API_KEY } });
        const data = await res.json();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
