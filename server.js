const express = require('express');
const path = require('path');
const fetch = global.fetch || require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// Serve static files (so you can open http://localhost:3000)
app.use(express.static(path.resolve(__dirname)));

app.post('/api/gemini', async (req, res) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'Google API key not configured on server. Set GOOGLE_API_KEY in environment.' });
    }

    // Expecting the client to send the same payload structure used previously
    const payload = req.body.payload;
    if (!payload) return res.status(400).json({ error: 'Missing payload in request body.' });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await response.json();
        // Mirror status code from Google if it's an error
        if (!response.ok) {
            return res.status(response.status).json({ error: json.error || json, details: json });
        }
        return res.json(json);
    } catch (err) {
        console.error('Error forwarding to Gemini:', err);
        return res.status(500).json({ error: 'Server error while contacting Gemini', details: err.message });
    }
});

app.post('/api/gemini-chat', async (req, res) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'Google API key not configured on server. Set GOOGLE_API_KEY in environment.' });
    }

    const { systemPrompt, compressedContext, recentMessages } = req.body;
    if (!recentMessages || !Array.isArray(recentMessages)) {
        return res.status(400).json({ error: 'Missing or invalid recentMessages in request body.' });
    }

    // Build the full conversation history for Gemini
    const contents = [];

    // If we have compressed context, add it as the first user message with a note
    if (compressedContext) {
        contents.push({
            role: 'user',
            parts: [{ text: `[Previous conversation summary: ${compressedContext}]` }]
        });
        contents.push({
            role: 'model',
            parts: [{ text: 'I understand the context from our previous discussion. Please continue.' }]
        });
    }

    // Add recent messages
    recentMessages.forEach(msg => {
        contents.push({
            role: msg.role,
            parts: [{ text: msg.content }]
        });
    });

    const payload = {
        contents,
        tools: [{ "google_search": {} }],
    };

    if (systemPrompt) {
        payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({ error: json.error || json, details: json });
        }
        return res.json(json);
    } catch (err) {
        console.error('Error forwarding to Gemini chat:', err);
        return res.status(500).json({ error: 'Server error while contacting Gemini', details: err.message });
    }
});

app.post('/api/gemini-summarize', async (req, res) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'Google API key not configured on server. Set GOOGLE_API_KEY in environment.' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing or invalid messages array in request body.' });
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

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({ error: json.error || json, details: json });
        }

        const summary = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!summary) {
            return res.status(500).json({ error: 'No summary received from Gemini.' });
        }

        return res.json({ summary });
    } catch (err) {
        console.error('Error summarizing conversation:', err);
        return res.status(500).json({ error: 'Server error while summarizing', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
