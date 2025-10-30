# Netlify Deployment Guide

This guide will help you deploy the Real Estate Financial Simulator to Netlify.

## Prerequisites

- A Netlify account (you already have one!)
- Your Google Gemini API key
- Git repository connected to your Netlify account

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Configure for Netlify deployment"
   git push origin main
   ```

2. **Connect repository to Netlify**
   - Log into your Netlify dashboard
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider and select this repository
   - Netlify will auto-detect the settings from `netlify.toml`

3. **Set environment variables**
   - In your Netlify site dashboard, go to: **Site settings** → **Environment variables**
   - Add the following variable:
     - **Key**: `GOOGLE_API_KEY`
     - **Value**: Your Google Gemini API key
   - Click "Save"

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your site
   - Your site will be live at `https://[your-site-name].netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI** (if not already installed)
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Netlify site**
   ```bash
   netlify init
   ```
   - Follow the prompts to connect to an existing site or create a new one

4. **Set environment variables**
   ```bash
   netlify env:set GOOGLE_API_KEY "your-api-key-here"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Testing Locally with Netlify Dev

You can test the Netlify functions locally before deploying:

1. **Install Netlify CLI** (if not already installed)
   ```bash
   npm install -g netlify-cli
   ```

2. **Create a `.env` file** (if you haven't already)
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Google API key

3. **Start Netlify Dev server**
   ```bash
   netlify dev
   ```
   This will start a local server (default: http://localhost:8888) that simulates the Netlify environment

## Files Added for Netlify

- **netlify.toml** - Netlify configuration file
- **netlify/functions/** - Serverless functions directory
  - **gemini.js** - Handles Gemini API requests
  - **gemini-chat.js** - Handles chat functionality
  - **gemini-summarize.js** - Handles conversation summarization

## Important Notes

- Your `GOOGLE_API_KEY` must be set in Netlify's environment variables for the AI chat feature to work
- The `.env` file is ignored by Git (check `.gitignore`) to keep your API key secure
- The frontend automatically routes `/api/*` requests to Netlify functions via redirects in `netlify.toml`
- The original `server.js` is no longer needed for deployment but can be kept for reference

## Troubleshooting

### Functions not working
- Check that `GOOGLE_API_KEY` is set in Netlify's environment variables
- Check the Functions tab in Netlify dashboard for error logs

### API requests failing
- Open browser DevTools → Network tab to see if requests are reaching `/api/*` endpoints
- Check that the redirects in `netlify.toml` are working

### Build fails
- Ensure all dependencies are listed in `package.json`
- Check the Netlify build logs for specific errors

## Custom Domain (Optional)

To use a custom domain:
1. Go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Follow the instructions to configure your DNS settings

---

Need help? Check the [Netlify documentation](https://docs.netlify.com/) or reach out for support!
