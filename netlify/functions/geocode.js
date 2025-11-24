exports.handler = async function (event, context) {
    const { city } = event.queryStringParameters;
    const API_KEY = process.env.OPENWEATHER_KEY;

    if (!city) {
        return { statusCode: 400, body: JSON.stringify({ error: 'City is required' }) };
    }

    try {
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Allow CORS
            }
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch coordinates' }),
        };
    }
};
