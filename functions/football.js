exports.handler = async (event) => {
    const type = event.queryStringParameters.type || 'standings';
    const queryParam = event.queryStringParameters.q;
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const YT_KEY = process.env.YOUTUBE_API_KEY;

    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    try {
        if (type === 'highlights') {
            const term = encodeURIComponent(`${queryParam} official highlights`);
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=relevance&type=video&q=${term}&key=${YT_KEY}`;
            const ytRes = await fetch(ytUrl);
            const ytData = await ytRes.json();
            return { statusCode: 200, headers, body: JSON.stringify(ytData.items || []) };
        }

        if (type === 'news') {
            // Using Sky Sports Premier League RSS
            const skyRss = `https://www.skysports.com/rss/12040`;
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(skyRss)}&api_key=oyfr7mqv5id7jhf6v6vxl9nscuxm4btvx8pux0v5`);
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

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
