const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 503,
            body: JSON.stringify({ error: 'Google API key not configured on server. Set GOOGLE_API_KEY in environment.' })
        };
    }

    try {
        const requestBody = JSON.parse(event.body);
        const payload = requestBody.payload;

        if (!payload) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing payload in request body.' })
            };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: json.error || json, details: json })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(json)
        };
    } catch (err) {
        console.error('Error forwarding to Gemini:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error while contacting Gemini', details: err.message })
        };
    }
};
