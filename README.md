# Nova — AI Chat Assistant

A rebuilt version of your chatbot: same HTML/CSS/JS structure, renamed to **Nova**,
now answering with a real AI model (Google's Gemini API, free tier) instead of a
fixed list of canned replies.

## What changed vs. the old version
- Renamed "AI Assistant" → "Nova" everywhere (title, header, status, comments).
- Replaced the hardcoded keyword-matching logic with a real call to the Gemini API,
  so Nova can answer open-ended questions instead of falling back to "I don't understand."
- Added a typing indicator, error handling (rate limits, bad key, offline), and a
  "New chat" button.
- Conversation is saved in the browser (`localStorage`) so a page refresh doesn't
  lose the chat.
- Redesigned the UI with a distinct "Nova" identity (deep space palette, pulsing orb
  avatar that speeds up while it's thinking).

## Setup (required — do this before it will answer anything)
1. Go to **https://aistudio.google.com/apikey** and sign in with a Google account.
2. Click **Create API key**. It's free, no credit card required.
3. Open `script.js`, find the line near the top:
   ```js
   const GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";
   ```
   and paste your key in between the quotes.
4. Open `index.html` in a browser (or push to GitHub Pages) and start chatting.

## Before you submit / share the link — restrict your key
Because this is a static site with no backend, the API key is visible in the page's
source code to anyone who looks. To stop it being copied and used elsewhere:
1. In Google AI Studio, open your key's settings.
2. Under **API restrictions**, restrict it to your model only (Generative Language API).
3. Under **Website restrictions / HTTP referrers**, add:
   ```
   https://yashkiratbatra22.github.io/*
   ```
4. Save. The key will now only work when called from your GitHub Pages site.

This won't stop someone from *seeing* the key, but it stops them from *using* it,
which is what actually matters — no one can rack up usage against your free tier.

## Free tier limits (good to know for a demo/submission)
Gemini 2.5 Flash's free tier currently allows roughly 10 requests per minute and a
few hundred per day — plenty for a class demo. If you see a "rate limit" message in
the chat, just wait a few seconds and try again.

## Files
- `index.html` — page structure
- `style.css` — all styling (no external CSS framework needed)
- `script.js` — Gemini API integration + chat logic (your API key goes here)
