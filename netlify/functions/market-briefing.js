const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 503,
            body: JSON.stringify({ error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in environment.' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'web-search-2025-03-05'
            },
            body: JSON.stringify(body)
        });

        const json = await response.json();
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: json.error || json }) };
        }
        return { statusCode: 200, body: JSON.stringify(json) };
    } catch (err) {
        console.error('Error forwarding to Anthropic:', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Server error', details: err.message }) };
    }
};
