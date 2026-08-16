# Deployment & architecture guide

Web Utility Suite is a PHP-rendered, JavaScript-enhanced single page application.
It is designed for cheap shared hosting (Hostinger) and deploys straight from GitHub.

---

## 1. File structure

    web-utility-suite/
    |
    |-- .htaccess                     Apache rewrite: everything -> index.php, HTTPS, headers, caching
    |-- index.php                     SEO shell. Emits per-URL title/description/OG/JSON-LD, then boots the SPA
    |-- sitemap.php                   Served as /sitemap.xml, generated from the route registry
    |-- robots.txt
    |
    |-- config/
    |   |-- routes.php                SINGLE SOURCE OF TRUTH: slug, title, description, H1, intro, FAQ per tool
    |   |-- bootstrap.php             Shared PHP runtime: config loader, JSON I/O, rate limiter, cURL, SSRF guards
    |   |-- secrets.sample.php        Template. Copy to secrets.php on the server (git-ignored + blocked by .htaccess)
    |
    |-- partials/
    |   |-- sidebar.php               Server-rendered navigation (real <a href> links = crawlable)
    |   |-- topbar.php                Mobile menu, breadcrumb, dark mode toggle
    |   |-- footer.php                Footer link block, keeps crawl depth at 1
    |
    |-- api/                          The ONLY code that ever sees an API key
    |   |-- convert.php               PDF <-> Word proxy (CloudConvert v2 by default)
    |   |-- tempmail.php              10 minute disposable inbox proxy (mail.tm by default)
    |   |-- dns.php                   DNS records + IP geolocation, with SSRF protection
    |   |-- ai.php                    Text summarizer + code explainer (any OpenAI-compatible endpoint)
    |
    |-- assets/
    |   |-- css/styles.css            Component layer on top of Tailwind
    |   |-- img/favicon.svg
    |   |-- js/
    |       |-- app.js                SPA router: pushState, popstate, live metadata swap, sidebar, theme
    |       |-- core/dom.js           Tiny DOM helpers used by every tool
    |       |-- core/api.js           Same-origin fetch client (no keys, no third-party hosts)
    |       |-- tools/
    |           |-- base64.js
    |           |-- hash-generator.js
    |           |-- ip-dns-lookup.js
    |           |-- json-formatter.js
    |           |-- url-encoder.js
    |           |-- jwt-decoder.js
    |           |-- qr-generator.js
    |           |-- barcode-generator.js
    |           |-- word-counter.js
    |           |-- password-generator.js
    |           |-- pdf-to-word.js
    |           |-- word-to-pdf.js
    |           |-- temp-mail.js
    |           |-- text-summarizer.js
    |           |-- code-explainer.js
    |           |-- shared/converter.js   Shared upload UI for both document converters
    |           |-- shared/ai.js          Shared prompt UI for both AI tools
    |
    |-- .github/workflows/deploy.yml  FTPS deploy to Hostinger on push to main

---

## 2. How the SEO architecture works

**The problem with SPAs:** one HTML file, one title, one description. Google can render
JavaScript, but it queues it, and social scrapers (Slack, WhatsApp, LinkedIn, X) do not
run it at all.

**The fix used here is three-layered:**

1. **Server first.** Apache rewrites every unknown path to index.php. index.php reads the
   slug from REQUEST_URI, looks it up in config/routes.php and prints the correct title,
   meta description, canonical, Open Graph, Twitter card, H1, intro copy, FAQ and JSON-LD
   before any script tag. Curl the URL and you get a complete, unique document.

2. **Client second.** assets/js/app.js intercepts clicks on internal links, calls
   history.pushState() so the address bar becomes /qr-generator with no reload, then
   rewrites the same tags from window.__ROUTES__ (a JSON copy of the PHP registry printed
   into the page). One registry, two renderers, zero drift.

3. **Progressive enhancement.** Every nav item is a real anchor, so middle-click, ctrl-click,
   "copy link address", browser back and forward all behave like a classic multi-page site.
   popstate re-renders. A crawler with JavaScript disabled still sees the full description.

**Test it:**

    curl -s https://yourdomain.com/jwt-decoder | grep -i "<title>"
    curl -s https://yourdomain.com/qr-generator | grep -i "og:description"

Both must return tool-specific values. If they return the home page copy, the rewrite is
not active.

---

## 3. First deploy on Hostinger

1. **Point the domain** at your hosting plan and issue the free SSL certificate
   (hPanel > Security > SSL). The .htaccess forces HTTPS.

2. **Upload the repo** into /public_html. Either use the GitHub integration
   (hPanel > Website > GitHub) or let the included Actions workflow push over FTPS.

3. **Create the secrets file** on the server, never in git:

       cp config/secrets.sample.php config/secrets.php

   Then edit config/secrets.php and set SITE_URL plus whichever provider keys you use.

4. **Check PHP 8.1+** in hPanel > Advanced > PHP Configuration, and make sure the
   curl, fileinfo, mbstring and openssl extensions are enabled.

5. **Verify** that /sitemap.xml renders and that /robots.txt lists it, then submit the
   sitemap in Google Search Console.

### GitHub Actions secrets

| Secret | Example |
|---|---|
| FTP_SERVER | ftp.yourdomain.com |
| FTP_USERNAME | u123456789.deploy |
| FTP_PASSWORD | (from hPanel > Files > FTP Accounts) |
| FTP_DIR | /public_html/ |

The workflow lints every PHP file before uploading and excludes config/secrets.php from
the sync, so your keys survive every deploy.

---

## 4. Configuration

config/secrets.php values, all optional except the ones for the tools you enable:

| Key | Used by | Notes |
|---|---|---|
| SITE_URL | index.php, sitemap.php | Canonical origin, e.g. https://tools.example.com |
| AI_API_BASE / AI_API_KEY / AI_MODEL | api/ai.php | Any OpenAI-compatible endpoint |
| CONVERT_API_KEY / CONVERT_API_BASE | api/convert.php | CloudConvert v2 by default |
| TEMPMAIL_API_BASE | api/tempmail.php | mail.tm, keyless |
| RATE_LIMIT_PER_MIN | all endpoints | Default 20 requests per IP per minute |
| ALLOWED_ORIGINS | all endpoints | Leave empty for same-origin only |

Environment variables always win over the file, so you can also set them in
hPanel > Advanced > PHP Configuration.

---

## 5. Security model

- **No key in the browser.** Search the whole assets/js tree: the only host it ever
  contacts is /api/ on the same origin. Keys live in config/secrets.php, which is
  git-ignored and denied by a FilesMatch rule in .htaccess.
- **SSRF protection.** api/dns.php validates hostname syntax and rejects private,
  loopback and reserved IP ranges before any outbound request.
- **Upload validation.** api/convert.php checks the extension, the real MIME type via
  finfo, and a 20 MB ceiling, then deletes the temp file in a finally block.
- **Rate limiting.** A lock-file counter in the system temp directory, keyed per IP per
  minute per endpoint. No database required on shared hosting.
- **No raw provider HTML.** api/tempmail.php strips tags and returns plain text only, so
  a malicious email can never inject markup into the inbox view.
- **Headers.** nosniff, SAMEORIGIN, strict-origin-when-cross-origin, HSTS and a
  restrictive Permissions-Policy are set in .htaccess.

---

## 6. Adding a new tool

1. Add an entry to config/routes.php (slug, category, nav, title, description, h1, intro, faq).
2. Create assets/js/tools/your-slug.js exporting a mount(root) function that returns an
   optional cleanup function.
3. Register the lazy import in the TOOLS map at the top of assets/js/app.js.

The sidebar, footer, breadcrumb, sitemap, JSON-LD and per-URL metadata all update
automatically. No other file needs to change.

---

## 7. Production Tailwind (optional but recommended)

The shell loads the Tailwind Play CDN so the project runs with zero build step. For
production, compile instead:

    npm init -y
    npm i -D tailwindcss
    npx tailwindcss init

tailwind.config.js content globs:

    content: ["./index.php", "./partials/**/*.php", "./assets/js/**/*.js", "./config/routes.php"]

Build, then replace the CDN script tag in index.php with a link to the output file:

    npx tailwindcss -i ./assets/css/tailwind.src.css -o ./assets/css/tailwind.min.css --minify

Uncomment the build step in .github/workflows/deploy.yml so CI does it for you.

---

## 8. Performance notes

- Tool modules are lazy-loaded: opening /base64 downloads about 4 KB of JavaScript, not
  the whole suite.
- qrcode.js and JsBarcode load from jsDelivr with defer, so they never block first paint.
- Static assets get a one year cache header; HTML is always revalidated.
- Everything except the four proxied tools runs entirely offline in the browser, which is
  what keeps hosting cost effectively zero.
