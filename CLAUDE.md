# CLAUDE.md — furealestate

This file provides AI assistants with a concise reference for working in this codebase.

---

## Project Overview

**furealestate** is a browser-based real estate financial analysis tool with three pages:

| Page | File | Purpose |
|------|------|---------|
| Buy vs Rent Calculator | `index.html` | Primary tool — compares wealth accumulation of buying vs renting over time |
| Investment Analysis | `investment.html` | Investment-focused financial modeling |
| Short-Term Rental Analysis | `rental-analysis.html` | Analyzes short-term rental property investment |

All three pages share `script.js` for core logic and use an AI-powered chat panel backed by Google Gemini.

The application is **stateless** — no database, no user accounts. All calculations are client-side; the server only proxies Gemini API calls.

---

## Architecture

```
Browser (HTML + Tailwind + Chart.js)
    │  user interaction
    ▼
script.js  ──── getValues() ────► calculator engine
    │                                    │
    │  /api/gemini-chat                  ▼ updateCharts()
    ▼
server.js (Express) or netlify/functions/
    │  GOOGLE_API_KEY
    ▼
Google Gemini API (gemini-2.5-flash-preview-05-20)
```

- **No build step.** Static files are served as-is. All JS is vanilla ES6+ running directly in the browser.
- **API key security.** The `GOOGLE_API_KEY` lives only on the server; the client never sees it.
- **Dual deployment targets.** `server.js` (Express) for local/Node hosting; `netlify/functions/` for Netlify serverless.

---

## File Structure

```
/
├── index.html                  # Buy vs Rent Calculator (primary)
├── investment.html             # Investment Analysis
├── rental-analysis.html        # Short-Term Rental Analysis
├── script.js                   # Shared core app logic (~1277 lines)
├── style.css                   # Custom styles augmenting Tailwind
├── server.js                   # Express.js proxy server
├── netlify/
│   └── functions/
│       ├── gemini.js           # Serverless: general Gemini proxy
│       ├── gemini-chat.js      # Serverless: chat with context compression
│       └── gemini-summarize.js # Serverless: conversation summarization
├── netlify.toml                # Netlify deployment config
├── .env.example                # Environment variable template
├── package.json
├── README.md                   # Quick start
└── DEPLOYMENT.md               # Netlify deployment guide
```

---

## Development Setup

### Prerequisites
- Node.js (any recent LTS version)
- A Google Gemini API key (Generative Language API)

### Local development

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env — set GOOGLE_API_KEY=your_key_here

# 2. Install dependencies
npm install

# 3. Start server with auto-reload
npm run dev

# 4. Open browser
open http://localhost:3000
```

`npm start` runs `node server.js` (no auto-reload); `npm run dev` uses `nodemon`.

### Netlify local (optional)

```bash
netlify dev   # uses netlify/functions/ instead of server.js
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | Yes | — | Google Gemini API key |
| `PORT` | No | `3000` | Server listen port |

**Never commit `.env`.** It is gitignored.

---

## API Endpoints

All three endpoints are mirrored in `server.js` and `netlify/functions/`.

### `POST /api/gemini`
General Gemini proxy.
```json
// Request body
{ "payload": { /* Gemini generateContent payload */ } }
```

### `POST /api/gemini-chat`
Chat with conversation context compression.
```json
// Request body
{
  "systemPrompt": "string",
  "compressedContext": "string | null",
  "recentMessages": [{ "role": "user|model", "content": "string" }]
}
```

### `POST /api/gemini-summarize`
Summarizes a message array to compress context.
```json
// Request body
{ "messages": [{ "role": "user|model", "content": "string" }] }
// Response
{ "summary": "string" }
```

Netlify deployment redirects `/api/*` → `/.netlify/functions/:splat` via `netlify.toml`.

---

## Key Code Patterns

### Input handling
- Every calculator input is a **slider + number input pair** kept in sync via `input` event listeners.
- `getValues()` (in `script.js`) reads all input values from the DOM and returns a single config object.

### Chart management
- Chart.js instances are stored in module-level variables (`wealthChart`, `costChart`, etc.).
- `updateCharts(simulationData)` rebuilds/updates all charts from a simulation result object.

### Chat state (`chatState` object in `script.js` ~line 298)
```js
{
  isOpen: false,
  compressedContext: null,     // summarized older history (token savings)
  recentMessages: [],          // last KEEP_RECENT_COUNT messages in full
  messageCount: 0,
  lastSummarizedAt: 0,
  lastAnalyzedParams: null,    // calculator params snapshot for context
  systemPrompt: "...",         // defines AI financial advisor behavior
  SUMMARIZE_THRESHOLD: 8,      // trigger summary after this many messages
  KEEP_RECENT_COUNT: 5         // messages kept verbatim after summary
}
```
When `messageCount` reaches `SUMMARIZE_THRESHOLD`, older messages are summarized via `/api/gemini-summarize` and stored in `compressedContext`.

### Simulation data structure
`runSimulation()` returns an object used throughout the UI:
```js
{
  years: number[],
  buyer_wealth: number[],
  renter_wealth: number[],
  buyer_cumulative_costs: number[],
  monthly_costs_breakdown: { mortgage, property_tax, insurance, maintenance, pmi },
  monthlyCosts: { ... },
  rentalAnalysis: { average_annual_rental_cash_flow },
  leverageAnalysis: { appreciation_gain_y1, year1_principal_paid, ... }
}
```

---

## Frontend Libraries (CDN, no install)

| Library | Purpose |
|---------|---------|
| Tailwind CSS | Utility-first layout and styling |
| Chart.js | All charts (line, pie) |
| chartjs-plugin-datalabels | Labels on chart data points |
| Google Fonts (Inter) | Typography |

These are loaded via `<script>` / `<link>` tags in each HTML file — no npm packages.

---

## Backend Dependencies (npm)

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `cors` | CORS headers |
| `dotenv` | Load `.env` file |
| `node-fetch` | HTTP client for Gemini calls |
| `nodemon` (dev) | Auto-restart on file changes |

---

## Styling Conventions

- **Tailwind first.** Use Tailwind utility classes for layout, spacing, color, and typography.
- **`style.css` for exceptions.** Only add custom CSS for things Tailwind cannot handle cleanly: range input (slider) styling, loading spinners, component-specific overrides.
- Avoid inline `style=` attributes except for dynamically computed values (e.g., chart colors set in JS).

---

## Deployment

See `DEPLOYMENT.md` for detailed Netlify steps. Quick summary:

- Set `GOOGLE_API_KEY` in Netlify environment variables.
- `netlify.toml` handles routing — no manual configuration required.
- The `publish` directory is `.` (repository root).

---

## Testing

There is **no automated test suite**. Verification is manual:

1. Start the server (`npm run dev`).
2. Open each page and adjust sliders — charts and computed values should update.
3. Open the chat panel and send a message — a Gemini response should appear.
4. Verify the console shows no errors.

If adding tests in the future, consider **Jest** for unit-testing pure calculator functions in `script.js`.

---

## Common Gotchas

- **Missing API key**: The server returns `503` with a clear error if `GOOGLE_API_KEY` is not set.
- **1 MB request limit**: `server.js` sets `express.json({ limit: '1mb' })`. Large conversation contexts may need compression before sending.
- **Netlify vs Express**: When running locally with `npm start`, edits to `netlify/functions/` have no effect. Edit `server.js` for local backend changes.
- **No bundler**: Import/export syntax does not work in browser-loaded `script.js`. Keep it as a single IIFE or rely on global scope.
