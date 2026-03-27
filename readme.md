# Humaniser

A simple web app that rewrites AI-generated text to sound more natural using an OpenRouter model.

## Why this setup (important)

You said you do **not** want to paste your API key into the website.
This version keeps your OpenRouter key on a backend endpoint (`/api/humanise`) so the key is never exposed in frontend code or your GitHub Pages files.

## Project files

- `index.html`, `styles.css`, `app.js`: static frontend (safe for GitHub Pages)
- `worker.js`: backend proxy example (Cloudflare Worker) that stores your API key in environment secrets

## Quick Start (local idea)

1. Deploy frontend to GitHub Pages.
2. Deploy `worker.js` as a Cloudflare Worker.
3. Set Worker secrets:
   - `OPENROUTER_API_KEY` = your OpenRouter key
   - `SITE_URL` = your GitHub Pages URL (for example `https://yourname.github.io`)
4. Route your worker to `/api/humanise` on your domain, or update `app.js` to use your Worker URL.
5. Open your site and use it without entering any API key in the UI.

## Deploy options

### Option A (recommended): Custom domain

- Point your custom domain to GitHub Pages.
- Put Cloudflare in front of it.
- Create Worker route: `https://yourdomain.com/api/humanise`.

Then `fetch('/api/humanise')` works without frontend changes.

### Option B: No custom domain

- Keep GitHub Pages default URL.
- Deploy Worker on `*.workers.dev`.
- Change `app.js` fetch URL from `/api/humanise` to your full Worker URL.

## Notes

- The frontend stores only the chosen **model ID** in `localStorage`.
- The API key is not in repo files and not typed into the page.
