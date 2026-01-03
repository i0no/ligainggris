exports.handler = async (event) => {
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const type = event.queryStringParameters.type || 'standings';
    
    const endpoint = type === 'matches' 
        ? 'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED'
        : 'https://api.football-data.org/v4/competitions/PL/standings';

    try {
        const response = await fetch(endpoint, {
            headers: { 'X-Auth-Token': API_KEY }
        });
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                // Cache data for 5 minutes to save API requests
                "Cache-Control": "public, max-age=300"
            },
            body: JSON.stringify(data)
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: "Upstream Error" }) };
    }
};
