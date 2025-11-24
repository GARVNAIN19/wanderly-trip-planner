exports.handler = async function (event, context) {
    const { lat, lon } = event.queryStringParameters;
    const API_KEY = process.env.OPENWEATHER_KEY;

    if (!lat || !lon) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Latitude and Longitude are required' }) };
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch weather' }),
        };
    }
};
