exports.handler = async (event) => {
    const type = event.queryStringParameters.type || 'standings';
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const YT_KEY = process.env.YOUTUBE_API_KEY;

    try {
        let data;
        if (type === 'highlights') {
            // channelId: UCNAf1k0yIjyGu3k9BwAg3lg is Sky Sports Premier League
            // This ensures ONLY their uploads appear.
            const channelId = "UCNAf1k0yIjyGu3k9BwAg3lg";
            const query = encodeURIComponent("Premier League Highlights");
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=6&order=date&type=video&q=${query}&key=${YT_KEY}`;

            const res = await fetch(ytUrl);
            const ytData = await res.json();

            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ytData.items || [])
            };
        } else {
            const ENDPOINTS = {
                standings: 'https://api.football-data.org/v4/competitions/PL/standings',
                results: 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED',
                fixtures: 'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED'
            };
            const res = await fetch(ENDPOINTS[type], { headers: { 'X-Auth-Token': API_KEY } });
            data = await res.json();
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=120" },
            body: JSON.stringify(data)
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
