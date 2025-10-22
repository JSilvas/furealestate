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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
