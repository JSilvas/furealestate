# furealestate — Local Development

This small project is a browser-based Buy vs Rent simulator. The Gemini LLM integration requires a server-side API key; the client should call a local proxy so the key is never exposed.

Quick start

1. Copy `.env.example` to `.env` and set your `GOOGLE_API_KEY`.

2. Install dependencies:

```bash
npm install
```

3. Run server:

```bash
npm start
```

4. Open http://localhost:3000 in your browser and test the app. The client will post Gemini payloads to `/api/gemini` which will forward them to the Google Gemini Generative Language API.

Security

- Never commit the `.env` file with your API key.
- The proxy simply forwards requests — in production you should add authentication and request-size limits.
