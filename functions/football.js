exports.handler = async (event) => {
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const type = event.queryStringParameters.type || 'standings';

    let endpoint = '';
    if (type === 'matches') endpoint = 'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED&limit=5';
    if (type === 'results') endpoint = 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED&limit=10';
    if (type === 'standings') endpoint = 'https://api.football-data.org/v4/competitions/PL/standings';

    try {
        const response = await fetch(endpoint, { headers: { 'X-Auth-Token': API_KEY } });
        const data = await response.json();
        return {
            statusCode: 200,
            headers: { "Cache-Control": "public, max-age=300" },
            body: JSON.stringify(data)
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
