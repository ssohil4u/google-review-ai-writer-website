# Google Review AI Writer — Google Business Profile Review Assistant

An open-source website that helps customers turn their real experiences into editable Google reviews. Choose a service, select the points that describe your experience, pick a language, and create a draft with Google Gemini. Read it, make any changes, then copy and post it on Google yourself.

**[Try the live demo](https://googlenow.netlify.app/)** · [Local setup](#run-the-website-locally) · [Netlify deployment](#deploy-to-netlify) · [Customization](#customize-the-website-for-your-business) · [FAQs](#frequently-asked-questions)

Looking for a **Google My Business AI review writer website** or a **Google Business Profile review assistant** you can host yourself? This repository includes the frontend, server-side Gemini integration, multilingual drafts and deployment configuration.

The source uses fictional **Demo Studio, Sample City** details and placeholder images. The live demo is a separate branded deployment. No real customer photographs, business contact details, API keys or active Google review destinations are bundled in this repository.

![Generic Google review assistant share banner with Demo Studio branding](public/assets/demo-review-share.jpg)

## How the review writer works

1. Choose the service you personally used.
2. Select one or more points that match your experience. Add your own feedback if you want to explain a detail or concern.
3. Choose **English, Hindi, Hinglish or Gujarati** and generate a review draft.
4. Read the draft and edit anything that does not reflect your experience.
5. Tap **Copy review**, then **Open Google Profile**. Paste the text on Google, choose your own rating and submit it yourself.

The assistant helps with wording. It does not post reviews, choose ratings, create customer experiences or guarantee that Google will accept a review.

## Who can use this project?

Small business owners can adapt the website for customers who want help putting feedback into words. Developers can use it as a vanilla JavaScript example of a Gemini review-writing app, streaming responses, clipboard handling and Netlify Functions.

The included experience categories focus on photography, celebrations and event setups. Replace them with your own services before using the site for a different type of business. All feedback, including criticism, should remain welcome.

## Features

| Feature | What it does |
| --- | --- |
| Mobile-first review flow | Guides the customer from service selection to copying and opening Google. |
| Category-specific experience points | Starts with six relevant options; the first selection adds up to six more when available. |
| Selected points at the top | Keeps chosen details easy to find as the customer adds more. |
| Four output languages | English is the default; Hindi uses Devanagari, Gujarati uses Gujarati script, and Hinglish uses Latin script. |
| Editable AI review drafts | Produces a short account based on the customer's selected facts and written feedback. |
| Streaming and loading animation | Shows text as it arrives, with typing messages while the request is in progress. |
| Similarity checks | Compares a draft with recent drafts in the same tab and can retry overly similar wording. |
| Separate copy and Google buttons | Lets the customer copy first and open their business's review destination afterwards. |
| Same-tab recovery | Preserves choices and drafts, with Copy again when returning from Google. |
| Share preview metadata | Includes Open Graph and Twitter card tags plus a generic share image. |

Similarity checks do not guarantee globally unique reviews. Language checks detect the expected script; they do not prove translation quality. Customers should check every generated draft before sharing it.

## Technology

- HTML, CSS and vanilla JavaScript for the website.
- Google Gemini API for review drafting, called from the server.
- Netlify Functions for the hosted API endpoint.
- Node.js for local development and automated tests.
- Locally bundled lottie-web for the waiting animation.

There is no frontend framework, database or npm runtime dependency to install. The optional Cloudflare Worker adapter is also included in `worker.mjs`; the supplied hosting configuration targets Netlify.

## Run the website locally

You need **Node.js 22 or newer**, your own Gemini API key and a model available to your Google AI Studio project.

1. Fork or download this repository and open its root folder in a terminal.
2. Create your local environment file:

   ```sh
   cp .env.example .env
   ```

3. Edit `.env` and replace the key placeholder:

   ```dotenv
   GEMINI_API_KEY=replace_with_your_own_key
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

   The model name is the starter's configured value. If it is unavailable to your project, set a model you can access and check its supported generation settings in `worker.mjs`.

4. Start the app:

   ```sh
   npm run dev
   ```

5. Open **http://127.0.0.1:8787/**.

Keep `.env` and `.dev.vars` private. Only `.env.example`, containing dummy values, belongs in the public repository. The API key must stay on the server and must never be added to files under `public/`.

Run the checks before submitting a change:

```sh
npm test
npm run build
```

Tests use mocked provider responses. They do not verify your actual Gemini quota, hosting configuration or compatibility with every phone browser.

## Deploy to Netlify

1. Upload the repository contents with `package.json`, `worker.mjs` and `netlify.toml` at the root.
2. Import the repository into Netlify.
3. Use the settings in `netlify.toml`:

   | Setting | Value |
   | --- | --- |
   | Build command | `npm run build` |
   | Publish directory | `public` |
   | Functions directory | `netlify/functions` |

4. Add `GEMINI_API_KEY` and `GEMINI_MODEL` to the host environment, including the Functions scope and Production context.
5. Customize the demo business details and Google review URL, then deploy with Functions included.
6. Test generation, language switching, copying, opening Google and returning to the draft on your target devices.

Uploading only the `public` folder will not include the Gemini endpoint. **GitHub Pages alone cannot run this server-side API**; you would need a separate backend.

For a public deployment, add hosting-appropriate rate limiting and monitoring. The optional Worker rate limiter binding is not automatically configured on Netlify. Review the provider's data handling and your hosting limits before collecting customer feedback.

## Customize the website for your business

Business details currently appear in several files. Changing `config.json` alone will not replace all demo branding or server-side context.

| File | What to change |
| --- | --- |
| `public/config.json` | Business name and direct Google review URL. The destination is blank by default. |
| `public/index.html` | Header, footer, dummy contacts, image alt text, page title, descriptions and social metadata. |
| `public/app.js` | Demo display copy and storage key where needed. |
| `public/experiences.js` | Service categories and factual experience points for each category. |
| `worker.mjs` | Demo Studio business name, Sample City location and review-writing instructions. |
| `stream-review.mjs` | Location validation currently expecting Sample City; update it and related tests. |
| `public/sitemap.xml` and `public/robots.txt` | Replace example.com with your deployment domain. |
| `public/assets/` | Replace generic business and share images with images you have permission to use. |

Set your own direct review link in `public/config.json`. Opening Google is disabled until that link is configured. Keep the Google review destination available to customers regardless of the sentiment of their feedback.

You can also create a QR code pointing to your deployed website URL and place it on a receipt, invitation or counter display. That QR code should open your assistant website; the site's Google button should use the business's direct review link.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| “API key not configured” or a key/model error | Confirm the server can read `GEMINI_API_KEY`, the model is accessible, and the latest environment settings were included in deployment. |
| Generation is slow or times out | Check Gemini quota, provider availability and host execution limits. Retry without losing the selected points; do not assume fewer points always means a faster response. |
| Google Profile does not open | Add your direct review URL to `public/config.json`; the demo intentionally has no live destination. |
| Wrong language after switching | Deploy the latest frontend and backend together, refresh, select the language and generate a new draft. Existing drafts are not automatically translated. |
| Mobile copy is blocked | Use the selected-text fallback to copy manually, then open Google separately. Test over HTTPS on deployed sites. |
| The review sounds generic | Add one genuine personal detail in the feedback field, then read and edit the draft. Do not add invented details just to make it sound different. |
| WhatsApp still shows the old image | Verify the deployed absolute image URL and metadata. Social platforms may retain a cached preview. |

## Frequently asked questions

### Is this a Google My Business review generator?

It is an AI-assisted Google review writer for customers reviewing a business on Google. “Google My Business” is a name people still use when looking for tools related to Google Business Profile. This project helps draft customer feedback; it does not manage a business listing or publish reviews through Google APIs.

### Is the Google review writer free to use?

The project code is available under the MIT license. Gemini API usage and hosting have their own pricing, quotas and availability. Any provider free tier depends on your account and current terms; this repository does not include free API access.

### Can I use it for my own business or a client?

Yes. The MIT license allows code reuse and modification, including commercial use, subject to its terms. Replace demo details, configure your own provider credentials and review link, and retain the included license notices. Google marks are not covered by the project license.

### Does it support Hindi, Hinglish and Gujarati Google reviews?

Yes. Customers can choose those languages or English before generating a draft. Business and service identifiers may remain in Latin script. Review the output for meaning and accuracy before posting.

### Can it automatically post a Google review or give five stars?

No. Customers copy the review, open Google, choose their own rating and post it themselves. There is no automatic posting or preset rating.

### Will AI-written reviews improve Google rankings?

This project makes no ranking, review acceptance or AI-detection guarantees. Use it to help customers express real experiences, not to manufacture reviews or influence ratings. Keep the wording accurate and let the customer decide what to publish.

### Does the app store customer reviews?

The frontend keeps selections and drafts in `sessionStorage` within the same tab. The supplied application has no review database. Feedback is sent to Gemini when generation is requested; hosting logs and provider retention are separate. Avoid entering sensitive personal information and keep the privacy disclosure accurate for your deployment.

## Honest feedback and privacy

Only select points describing actual experience. Do not invent events, offer incentives, filter customers by sentiment or auto-post reviews. Preserve criticism and mixed feedback when drafting. The customer should read and edit the result before posting.

The app shares selected facts and written feedback with Google Gemini. Review the [Gemini API terms](https://ai.google.dev/gemini-api/terms) for your chosen service tier and adjust the on-page disclosure accordingly.

For the Google destination and review-sharing process, see [Google's guide to getting reviews](https://support.google.com/business/answer/3474122). This project is independent and is not affiliated with or endorsed by Google.

## Source code map

- `public/app.js`: screens, selected points, language state and clipboard actions.
- `public/review-language.js`: output script checks.
- `public/review-variation.js`: recent-draft wording comparison.
- `public/review-stream.js`: browser-side streaming response handling.
- `worker.mjs`: request validation and Gemini API calls.
- `stream-review.mjs`: upstream stream parsing and completion checks.
- `netlify/functions/polish.mjs`: Netlify API adapter.
- `scripts/dev.mjs`: local development server.
- `*.test.mjs`: automated regression checks.

## Contributing and license

Bug reports and focused pull requests are welcome. Include the browser, selected language and reproduction steps. Run `npm test` and `npm run build` before submitting a change. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md); never post API keys or private customer feedback in issues.

Project code is [MIT licensed](LICENSE). Bundled lottie-web retains its own MIT license in [public/vendor/lottie-LICENSE.md](public/vendor/lottie-LICENSE.md). Google names and logos remain the property of their owner; the MIT license grants no trademark rights or endorsement.
