# auctixtech.com

Marketing site for AUCTIX by Auctix LLC. Plain static HTML, CSS and a little JavaScript: no build step, no dependencies.

## Pages

| URL | File |
|---|---|
| `/` | `index.html` |
| `/nonprofits` | `nonprofits.html` |
| `/pricing` | `pricing.html` |
| `/demo` | `demo.html` (interactive click-through demo with sample data; one self-contained file) |
| `/get-started` | `get-started.html` (three-step lead form, `assets/js/get-started.js`) |
| any unknown URL | `404.html` |

Shared styles are in `assets/css/site.css` (brand: navy #191B53, royal #0D459F, light blue #7FA3E0, Manrope). Logos, favicon, app icon and the social share image (`og-image.png`, 1200×630) are in `assets/img/`.

## Hosting

Works as-is on Cloudflare (Workers or Pages) or Vercel, with clean URLs (`/pricing` serves `pricing.html`):

- **Cloudflare Workers (current setup):** the repo is connected to a Worker with Workers Builds, which runs `npx wrangler deploy` on every push to `main`. `wrangler.jsonc` serves the repo as static assets (clean URLs, `404.html` for unknown paths); `.assetsignore` keeps the README and config files from being published. `_headers` and `_redirects` apply here too. The `name` in `wrangler.jsonc` must match the Worker's name in the Cloudflare dashboard.
- **Cloudflare Pages:** connect this repo, framework preset "None", build command empty, output directory `/`. `_headers` sets security and cache headers; `_redirects` sends `/privacy` and `/privacy-policy` to the app's privacy policy.
- **Vercel:** import the repo with no framework and no build command. `vercel.json` turns on clean URLs and the same redirects.

Then point `auctixtech.com` (and `www`) at the host in Cloudflare DNS. `app.auctixtech.com` stays on Vercel and is unaffected.

## The Get started form

The form posts JSON to the address in `data-endpoint` on `<form id="gs-form">` in `get-started.html`. It's empty until the AUCTIX web-form endpoint exists (planned in the `auctix-business` repo: it creates a contact, an opportunity, a note with the answers and a follow-up task in the Auctix organization, and emails info@auctixtech.com). While it's empty, or if the request fails, visitors still see their summary plus an "Email these answers to Auctix" button with everything filled in.

Fields sent: name, email, phone, organization, org_type, team_size, tools[], accounting, monthly_spend, admin_hours, goals[], time_back, timeline, plan_interest, recommended_plan, recommended_price, page, website (honeypot: must be empty), elapsed_ms.

## Editing

Edit the HTML directly; every page carries its own header and footer. The demo is one file, `demo.html`: its screens, sample data and guided tours are all in the script at the bottom. The same file is also published as a Claude artifact (https://claude.ai/artifact/1sTEfjhdrLTn3L3Vum1nkX); keep the two in sync. When prices change, update `pricing.html`, the plan summary in `nonprofits.html` and `recommend()` in `assets/js/get-started.js`.
