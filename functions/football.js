exports.handler = async (event) => {
    const type = event.queryStringParameters.type || 'standings';
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const YT_KEY = process.env.YOUTUBE_API_KEY;

    try {
        let data;
        if (type === 'highlights') {
            // Fetching from Official Premier League & Sky Sports IDs
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&order=date&type=video&q=Premier+League+Official+Highlights&key=${YT_KEY}`;
            const res = await fetch(ytUrl);
            const ytData = await res.json();
            data = ytData.items || [];
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
