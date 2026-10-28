# Google Review Assistant

**[🚀 Try the Live Demo](https://googlenow.netlify.app/)**

Explore the review-writing flow in the live business demo. This repository uses fictional demo details; the hosted demo is a separate branded deployment.

A mobile-first, editable Google review writing assistant with fictional **Demo Studio, Sample City** branding. No real business contacts, review destinations or customer photographs are bundled. Customers choose firsthand experience points, optionally add feedback, generate a draft, then copy it and post it on Google themselves.

## Features

- Category-specific random experience options; six more appear after the first selection when available.
- Selected options move to the top.
- English (default), Hindi, Hinglish and Gujarati output choices.
- Gemini streaming, typing/loading animation and recovery controls.
- Same-tab draft persistence, separate Copy and Open Google actions, and Copy again after return.
- Recent-draft similarity checks within a tab, with bounded retries. These do not guarantee globally unique text.
- Static social preview metadata and a bundled share banner.
- Vanilla HTML/CSS/JavaScript, a Node development server and Netlify Functions; no frontend framework.

## Run locally

Requires Node.js 22 or newer. There are no npm runtime dependencies to install.

```sh
cp .env.example .env
# Edit .env and add your own Gemini API key.
npm run dev
```

Open http://127.0.0.1:8787/. Keep `.env` private. The server-side API reads the key; it is never added to public JavaScript. `GEMINI_MODEL` must be a model available to your own Google AI Studio project; availability and quotas vary.

```sh
npm test
npm run build
```

## Deploy to Netlify

1. Push this directory to your own repository, keeping `package.json` and `netlify.toml` at the repository root.
2. Import the repository into Netlify. The configuration uses `npm run build`, the `public` directory, and `netlify/functions`.
3. Set `GEMINI_API_KEY` and `GEMINI_MODEL` in Netlify environment variables, including the Functions scope and Production context.
4. Deploy with Functions included. GitHub Pages alone cannot run this project's server-side Gemini endpoint.
5. Test generation, copying and the Google destination on your own phones after deployment.

This is a working starter, not a hosted API service. Add hosting-appropriate rate limiting and monitoring before opening a high-traffic endpoint. The optional Worker rate limiter binding is not automatically configured on Netlify.

## Customize before using for another business

This package uses fictional Demo Studio / Sample City details, an example.com domain, hello@example.com and no live Google review destination. Before deployment, customize:

- `public/config.json`: business name and your direct Google review URL. It is blank by default; opening Google is disabled until configured.
- `public/index.html`: demo header/footer, contact placeholders and SEO metadata. Remove or replace inactive phone/WhatsApp links.
- `public/app.js`: demo storage key and display copy where needed.
- `public/experiences.js`: service categories and factual experience points.
- `worker.mjs`: demo business name, Sample City location and instructions.
- `stream-review.mjs`: Sample City location validation; update it and the tests to your real location.
- `public/index.html`, `public/sitemap.xml`, `public/robots.txt`: replace example.com with your deployment domain.
- `public/assets/business-placeholder.svg` and `public/assets/demo-review-share.jpg`: original generic placeholders; replace with your own images and update alt text.

There are no original business photos, contact information, API keys, real Google review URLs or private deployment archives in this public package.

## Honest feedback and privacy

Only select points describing actual experience. Do not invent experiences, add incentives, filter customers by sentiment, or auto-post ratings/reviews. Customers must read and edit drafts before posting. An AI draft can still be inaccurate or repetitive; neither human authorship nor search/review-platform acceptance is guaranteed.

Feedback and selected facts go to Google Gemini when generation is requested. Keep the adjacent privacy disclosure and adapt it to your provider and deployment. Do not enter sensitive personal information. The frontend stores selections and drafts in sessionStorage in the same tab; the supplied code has no review database. Hosting/provider logs and data handling are governed separately.

## Project map

- `public/app.js`: screen flow, selection, clipboard and language state.
- `worker.mjs`: request validation and Gemini calls.
- `stream-review.mjs`: server-side SSE parsing and completion checks.
- `netlify/functions/polish.mjs`: Netlify adapter.
- `scripts/dev.mjs`: local development server.
- `*.test.mjs`: automated checks with mocked provider responses; tests do not prove real-device compatibility or provider availability.

## License and attribution

Project code is MIT licensed; see LICENSE. Bundled lottie-web retains its own MIT license in `public/vendor/lottie-LICENSE.md`. Google marks and Demo Studio branding remain the property of their owners; the MIT license grants no trademark rights or endorsement. Replace branding for your own deployment. This project is not affiliated with Google.

Contributions welcome: open an issue with reproduction steps or submit a focused pull request. Never post API keys or private customer feedback in issues.
