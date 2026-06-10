# Left TODOs

Status date: 2026-06-10. Everything below the line is open; everything else ships green
(109 unit tests, 105 e2e, Lighthouse 100x4 at 241 KB transfer, headers and links pass).

## Blocking the public push

1. **Deploy the landing.** `apps/druck-app/dist/` is a fully static build that passes all
   gates. No host is configured in the repo. Decide host (GitHub Pages / Netlify /
   Cloudflare Pages) and domain, then point it at the build output. Nothing else blocks
   going live.
2. **Publish widget 0.1.1 to npm.** Blocked on interactive npm browser auth (owner only):
   `cd packages/druck-widget && pnpm publish --access public --no-git-checks`.
   Afterwards: bump `WIDGET_CDN_URL` in `apps/druck-app/prerender/constants.mjs` to 0.1.1
   and recompute the README SRI hash
   (`curl -s <cdn-url> | openssl dgst -sha384 -binary | openssl base64 -A`).
3. **Publish css + engine patch versions.** The repo carries fixes that npm 0.1.0 does not
   have: `article.css` chapter rules are now scoped to `.article-shell` (npm 0.1.0 leaks
   them into the host page in light-DOM use), `feed.css` gained the
   `card-thumb--placeholder` styles, and the engine renders that placeholder when
   `heroImage` is missing. An embedder mixing new engine + old css gets unstyled
   placeholders. Publish engine/css/widget together.

## Content

4. **Replace stand-in demo images.** The brand poster (`/img/demo/druck-og.jpg`) currently
   stands in for the two Telegram photo posts and their two matching cards. Generate the
   ten diverse images from the prompt list (chat log, 2026-06-10), keep each under ~60 KB
   at 800 px wide, re-run `node scripts/audit.mjs` (transfer headroom is 9 KB).
5. **Social meta.** No `og:image` / `og:title` tags on the landing. The asset exists
   (`druck_og_header.png`); add the tags once the production domain is known (og:image
   needs an absolute URL).

## Code debt (non-blocking)

6. **Consolidate the two Telegram bubble renderers.** The landing's rich `tg-msg`
   renderer (`prerender/render-bands.mjs`) and the telegram-brief demo page's plain
   `tg-bubble` renderer (`prerender/render-demo-pages.mjs`) render the same fixture with
   different markup and CSS. Extract one shared renderer before adding any bubble
   features (photos and view counts currently exist only on the landing).
7. **`language.css` / public copy sync.** `public/article.css` is a hand-synced flattened
   copy of the package partials. The sync has held so far (verified byte-identical on the
   changed rules), but a build-time concat step would remove the drift risk.

## Paid layer (all TBD, see docs/MONETIZATION.md)

8. Hosted analytics endpoint + reading dashboard (client `siteToken` support is
   implemented and tested; no server exists).
9. Feed API (RSS/CSV to `ArticleData[]`).
10. Telegram channel importer bot.
11. Publish `@druck-editorial/analytics` to npm (~15 min of metadata work, no blocker).
