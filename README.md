# Web Utility Suite

SEO-friendly PHP + Tailwind single page application that bundles **15 free online tools**: document converters, InfoSec helpers, developer utilities, everyday business generators and AI assistants. It is built for cheap shared hosting (Hostinger), needs no build step, no database, and never exposes an API key to the browser.

> One page application, sixteen indexable URLs, zero build step.

## Why it is built this way

A conventional SPA ships one HTML document with one title and one meta description, so only the landing page ever ranks and social scrapers (Slack, WhatsApp, LinkedIn, X) see nothing useful. This project keeps the instant, no-reload feel of an SPA while giving every tool a real, indexable URL:

1. **Server first.** Apache rewrites every unknown path to `index.php`, which resolves the slug against `config/routes.php` and prints the matching title, description, canonical, Open Graph, Twitter card, `<h1>`, intro copy, FAQ and JSON-LD before a single script tag.
2. **Client second.** `assets/js/app.js` intercepts internal clicks, calls `history.pushState()` and rewrites those same tags from a JSON copy of the PHP registry, then lazy-loads only the module for that tool (about 4 KB).
3. **Progressive enhancement.** Every nav item is a real anchor, so middle-click, ctrl-click, back and forward behave exactly like a classic multi-page site, and the page is still complete with JavaScript disabled.

One registry, two renderers, zero drift.

## Tools

| Category | Tool | URL | Where it runs |
| --- | --- | --- | --- |
| Document Converters | PDF to Word | `/pdf-to-word` | PHP proxy |
| Document Converters | Word to PDF | `/word-to-pdf` | PHP proxy |
| Privacy & Communication | 10 Minute Email | `/temp-mail` | PHP proxy |
| InfoSec Tools | Base64 Encode / Decode | `/base64` | Browser |
| InfoSec Tools | Hash Generator (MD5, SHA-1/256/512) | `/hash-generator` | Browser |
| InfoSec Tools | IP & DNS Lookup | `/ip-dns-lookup` | PHP proxy |
| Developer Utilities | JSON Formatter & Validator | `/json-formatter` | Browser |
| Developer Utilities | URL Encode / Decode | `/url-encoder` | Browser |
| Developer Utilities | JWT Decoder | `/jwt-decoder` | Browser |
| Business & Daily Tools | QR Code Generator | `/qr-generator` | Browser |
| Business & Daily Tools | Barcode Generator | `/barcode-generator` | Browser |
| Business & Daily Tools | Word & Reading Time Counter | `/word-counter` | Browser |
| Business & Daily Tools | Password Generator | `/password-generator` | Browser |
| AI Tools | Text Summarizer | `/text-summarizer` | PHP proxy |
| AI Tools | Code Explainer | `/code-explainer` | PHP proxy |

Nine of the fifteen tools never make a network request at all. The other six talk only to `/api/*.php` on the same origin, which is the only place a provider key ever exists.

## Requirements

- PHP 8.1 or newer with the `curl`, `fileinfo`, `mbstring` and `openssl` extensions
- Apache with `mod_rewrite` (the bundled `.htaccess` does the routing), or any host that can map unknown paths to `index.php`
- No Composer, npm or database required

## Local development

Pretty URLs come from `.htaccess`, so the simplest local setup is any Apache + PHP stack (XAMPP, Laragon, MAMP, or `php:8.2-apache` in Docker) with the repository as the document root:

```bash
git clone https://github.com/LSDF/web-utility-suite.git
cd web-utility-suite
cp config/secrets.sample.php config/secrets.php
```

Then edit `config/secrets.php` and set `SITE_URL` plus the keys for whichever proxied tools you want to enable. That file is git-ignored and additionally denied by a `FilesMatch` rule in `.htaccess`, so it can never be served or committed. Everything except the six proxied tools works with an empty secrets file.

## Deployment

Push to `main` and `.github/workflows/deploy.yml` lints every PHP file, then uploads the site over FTPS while excluding `config/secrets.php`, so server-side keys survive every deploy. Add these repository secrets under Settings > Secrets and variables > Actions: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, and optionally `FTP_DIR` (defaults to `/public_html/`). The full walkthrough, including the Hostinger SSL and Search Console steps, is in [DEPLOYMENT.md](DEPLOYMENT.md).

## Security model

- **No key in the browser.** The entire `assets/js` tree only ever contacts `/api/` on the same origin.
- **SSRF guards.** `api/dns.php` validates hostname syntax and rejects private, loopback and reserved ranges before any outbound lookup.
- **Upload validation.** `api/convert.php` checks the extension, the real MIME type via `finfo` and a 20 MB ceiling, then unlinks the temp file in a `finally` block.
- **Rate limiting.** A lock-file counter per IP, per minute, per endpoint - 20 requests by default, no database needed.
- **No raw provider HTML.** `api/tempmail.php` strips tags and returns plain text, so a hostile email cannot inject markup into the inbox view.
- **Hardened headers.** `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`, HSTS and a restrictive `Permissions-Policy` are set in `.htaccess`.

## Adding a tool

1. Add an entry to `config/routes.php` (slug, category, nav, title, description, h1, intro, faq).
2. Create `assets/js/tools/<slug>.js` exporting a `mount(root)` function that optionally returns a cleanup callback.
3. Register the lazy import in the `TOOLS` map at the top of `assets/js/app.js`.

The sidebar, footer, breadcrumb, sitemap, JSON-LD and per-URL metadata all pick it up automatically.

## Project layout

```
index.php      SEO shell: per-URL metadata, then boots the SPA
sitemap.php    Served as /sitemap.xml, generated from the route registry
config/        routes.php (single source of truth), bootstrap.php, secrets.sample.php
partials/      Server-rendered sidebar, topbar and footer with crawlable links
api/           The only code that ever sees an API key
assets/js/     app.js router, core/ helpers, tools/ one module per tool
assets/css/    Component layer on top of Tailwind
```

## License

MIT - see [LICENSE.txt](LICENSE.txt). Third-party components and services are credited in [NOTICE.txt](NOTICE.txt).
