exports.handler = async (event) => {
    const type = event.queryStringParameters.type || 'standings';
    const API_KEY = process.env.FOOTBALL_API_KEY;

    const ENDPOINTS = {
        standings: 'https://api.football-data.org/v4/competitions/PL/standings',
        results: 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED',
        fixtures: 'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED',
        highlights: 'https://www.scorebat.com/video-api/v3/'
    };

    try {
        const url = ENDPOINTS[type];
        const headers = type === 'highlights' ? {} : { 'X-Auth-Token': API_KEY };
        const response = await fetch(url, { headers });
        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
            body: JSON.stringify(data)
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
