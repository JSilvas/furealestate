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
        const { messages } = JSON.parse(event.body);

        if (!messages || !Array.isArray(messages)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing or invalid messages array in request body.' })
            };
        }

        // Build conversation text for summarization
        let conversationText = 'Conversation to summarize:\n\n';
        messages.forEach(msg => {
            const role = msg.role === 'model' ? 'Assistant' : 'User';
            conversationText += `${role}: ${msg.content}\n\n`;
        });

        const summarizationPrompt = `Summarize this financial advisory conversation in 3-4 concise sentences. Focus on:
- The primary financial scenario being analyzed
- Key insights or recommendations provided
- User's main concerns or constraints
- Any important conclusions reached

Preserve specific numbers only if critical. This summary will be used as context for continuing the conversation.

${conversationText}

Summary:`;

        const payload = {
            contents: [{
                role: 'user',
                parts: [{ text: summarizationPrompt }]
            }]
        };

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

        const summary = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!summary) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'No summary received from Gemini.' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ summary })
        };
    } catch (err) {
        console.error('Error summarizing conversation:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error while summarizing', details: err.message })
        };
    }
};
