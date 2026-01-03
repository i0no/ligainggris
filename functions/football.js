exports.handler = async (event) => {
    const { type, q } = event.queryStringParameters;
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const YT_KEY = process.env.YOUTUBE_API_KEY;
    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    try {
        if (type === 'highlights') {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(q + ' official highlights')}&key=${YT_KEY}&type=video`;
            const res = await fetch(url);
            const data = await res.json();
            return { statusCode: 200, headers, body: JSON.stringify(data.items || []) };
        }
        if (type === 'news') {
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://www.skysports.com/rss/12040`);
            const data = await res.json();
            return { statusCode: 200, headers, body: JSON.stringify(data.items || []) };
        }
        // Standings, Results, Fixtures
        const endpoints = {
            standings: 'https://api.football-data.org/v4/competitions/PL/standings',
            results: 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED',
            fixtures: 'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED'
        };
        const response = await fetch(endpoints[type], { headers: { 'X-Auth-Token': API_KEY } });
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
