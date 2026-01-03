exports.handler = async (event) => {
    const type = event.queryStringParameters.type || 'standings';
    const queryParam = event.queryStringParameters.q;
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const YT_KEY = process.env.YOUTUBE_API_KEY;

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        if (type === 'highlights') {
            const term = encodeURIComponent(`${queryParam} official highlights`);
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=relevance&type=video&q=${term}&key=${YT_KEY}`;

            const res = await fetch(ytUrl);
            const data = await res.json();

            // If data.items is undefined, return empty array to prevent frontend crash
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data.items || [])
            };
        }

        if (type === 'news') {
            // Using a high-reliability RSS proxy
            const rssUrl = `https://www.skysports.com/rss/12040`;
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
            const data = await res.json();
            return { statusCode: 200, headers, body: JSON.stringify(data.items || []) };
        }

        const ENDPOINTS = {
            standings: 'https://api.football-data.org/v4/competitions/PL/standings',
            results: 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED',
            fixtures: 'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED'
        };

        const response = await fetch(ENDPOINTS[type], { headers: { 'X-Auth-Token': API_KEY } });
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };

    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
