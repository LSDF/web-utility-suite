<?php
/**
 * config/routes.php
 * ---------------------------------------------------------------------------
 * Single source of truth for the whole application.
 *
 *  - index.php  uses it to render per-URL <title>, meta description and OG tags
 *  - sidebar    is generated from the "category" of every entry
 *  - sitemap.php walks it to build /sitemap.xml
 *  - the JSON copy is handed to the browser so the SPA router can swap the
 *    metadata on history.pushState() without another round trip.
 *
 * Add a tool here + one JS module in /assets/js/tools and it is fully wired.
 */

return [

    /* ----------------------------------------------------------------- */
    /* Landing page                                                       */
    /* ----------------------------------------------------------------- */
    'home' => [
        'slug'        => '',
        'category'    => null,
        'nav'         => 'Home',
        'title'       => 'Web Utility Suite - 15 Free Online Developer & Business Tools',
        'h1'          => 'Free online tools for developers, marketers and everyday work',
        'description' => 'A fast, private, ad-light collection of free web tools: PDF to Word, QR codes, hashing, JSON formatting, JWT decoding, temporary email and AI helpers. No signup required.',
        'keywords'    => 'free online tools, web utility suite, developer tools, converter, generator',
        'intro'       => 'Every tool below runs in a single page application, yet each one has its own indexable URL, title and description. Client side tools never upload your data; server side tools proxy through hardened PHP endpoints so no API key is ever exposed to the browser.',
        'faq'         => [],
    ],

    /* ----------------------------------------------------------------- */
    /* 1. Document converters (PHP proxy)                                 */
    /* ----------------------------------------------------------------- */
    'pdf-to-word' => [
        'slug'        => 'pdf-to-word',
        'category'    => 'Document Converters',
        'nav'         => 'PDF to Word',
        'title'       => 'PDF to Word Converter - Free, Fast & Secure | Web Utility Suite',
        'h1'          => 'PDF to Word converter',
        'description' => 'Convert PDF files to editable Microsoft Word (.docx) documents online for free. Layout, tables and fonts are preserved and every upload is deleted from the server within minutes.',
        'keywords'    => 'pdf to word, pdf to docx, convert pdf, free pdf converter',
        'intro'       => 'Upload a PDF and download a fully editable .docx file. The browser never talks to the conversion vendor directly: the file is streamed to a PHP proxy on this domain which attaches the private API key server side.',
        'faq'         => [
            ['Is there a file size limit?', 'The default Hostinger friendly limit is 20 MB per document. Raise upload_max_filesize in .htaccess if you need more.'],
            ['Are my files stored?', 'Uploads are written to a temporary directory, streamed to the converter and unlinked in a finally block, so nothing is left on disk.'],
        ],
    ],

    'word-to-pdf' => [
        'slug'        => 'word-to-pdf',
        'category'    => 'Document Converters',
        'nav'         => 'Word to PDF',
        'title'       => 'Word to PDF Converter - Convert DOC & DOCX Online Free',
        'h1'          => 'Word to PDF converter',
        'description' => 'Turn DOC and DOCX files into pixel perfect PDF documents online. Free, no watermark, no registration, and your document never leaves our PHP proxy unencrypted.',
        'keywords'    => 'word to pdf, docx to pdf, convert word document, free pdf maker',
        'intro'       => 'Drop a .doc or .docx file below to receive a print ready PDF. Conversion happens on the server so the result is identical on every device.',
        'faq'         => [
            ['Do you add a watermark?', 'No. The PDF you download is exactly what the converter produced.'],
            ['Which formats are accepted?', 'DOC, DOCX, ODT and RTF are accepted by the same endpoint.'],
        ],
    ],

    /* ----------------------------------------------------------------- */
    /* 2. Privacy & communication                                         */
    /* ----------------------------------------------------------------- */
    'temp-mail' => [
        'slug'        => 'temp-mail',
        'category'    => 'Privacy & Communication',
        'nav'         => '10 Minute Email',
        'title'       => '10 Minute Temporary Email Generator - Disposable Inbox',
        'h1'          => '10 minute temporary email',
        'description' => 'Generate a disposable email address that self destructs after 10 minutes. Receive confirmation links without giving away your real inbox or your personal data.',
        'keywords'    => 'temporary email, disposable email, 10 minute mail, throwaway inbox',
        'intro'       => 'Create a throwaway inbox, use it for a signup or a download link, and let it expire. Messages are polled through a PHP proxy so the upstream mail provider never sees your IP address.',
        'faq'         => [
            ['How long does the address live?', 'Ten minutes by default. Press Extend to add another ten minutes while the tab is open.'],
            ['Can I send mail from it?', 'No. Disposable inboxes are receive only, which is what keeps them abuse resistant.'],
        ],
    ],

    /* ----------------------------------------------------------------- */
    /* 3. Ethical hacking & InfoSec                                       */
    /* ----------------------------------------------------------------- */
    'base64' => [
        'slug'        => 'base64',
        'category'    => 'InfoSec Tools',
        'nav'         => 'Base64 Encode / Decode',
        'title'       => 'Base64 Encoder and Decoder Online - UTF-8 Safe',
        'h1'          => 'Base64 encoder and decoder',
        'description' => 'Encode text to Base64 or decode Base64 back to plain text instantly in your browser. Full UTF-8 support, URL safe alphabet option, and nothing is ever uploaded.',
        'keywords'    => 'base64 encode, base64 decode, base64 converter, url safe base64',
        'intro'       => 'Base64 represents binary data with 64 printable ASCII characters. It is used in data URIs, HTTP basic auth, JWT segments and email attachments. This tool runs entirely on the client with TextEncoder, so payloads never leave the tab.',
        'faq'         => [
            ['Is Base64 encryption?', 'No. It is an encoding, fully reversible by anyone. Never use it to protect secrets.'],
            ['What is URL safe Base64?', 'A variant that swaps + and / for - and _ so the value can sit in a query string.'],
        ],
    ],

    'hash-generator' => [
        'slug'        => 'hash-generator',
        'category'    => 'InfoSec Tools',
        'nav'         => 'Hash Generator',
        'title'       => 'MD5 & SHA-256 Hash Generator Online - Free Checksum Tool',
        'h1'          => 'Hash generator (MD5, SHA-1, SHA-256, SHA-512)',
        'description' => 'Generate MD5, SHA-1, SHA-256 and SHA-512 hashes from any text or file directly in your browser using the Web Crypto API. Ideal for checksum verification and CTF work.',
        'keywords'    => 'md5 generator, sha256 hash, checksum tool, online hash calculator',
        'intro'       => 'SHA family digests are produced with the native Web Crypto API, and MD5 is computed with a compact bundled implementation because browsers deliberately refuse to expose it.',
        'faq'         => [
            ['Is MD5 still safe?', 'Only for non security checksums. MD5 and SHA-1 are both broken for collision resistance.'],
            ['Can I hash a file?', 'Yes, drop a file in and it is read with FileReader and hashed locally.'],
        ],
    ],

    'ip-dns-lookup' => [
        'slug'        => 'ip-dns-lookup',
        'category'    => 'InfoSec Tools',
        'nav'         => 'IP & DNS Lookup',
        'title'       => 'IP Address & DNS Record Lookup - A, AAAA, MX, TXT, NS',
        'h1'          => 'IP address and DNS record lookup',
        'description' => 'Look up A, AAAA, CNAME, MX, TXT, NS, SOA and CAA records for any domain, plus geolocation and ASN data for any IP address. Powered by a server side PHP resolver.',
        'keywords'    => 'dns lookup, mx record checker, ip lookup, whois, nslookup online',
        'intro'       => 'Queries are resolved by PHP on the server (dns_get_record with a DNS over HTTPS fallback), which means you see what a public resolver sees rather than what your own ISP cached.',
        'faq'         => [
            ['Why do results differ from my terminal?', 'Propagation. Authoritative changes can take up to the TTL of the old record to reach every resolver.'],
            ['Can I look up private ranges?', 'No. RFC1918 and loopback addresses are rejected by the proxy to prevent SSRF.'],
        ],
    ],

    /* ----------------------------------------------------------------- */
    /* 4. Developer utilities                                             */
    /* ----------------------------------------------------------------- */
    'json-formatter' => [
        'slug'        => 'json-formatter',
        'category'    => 'Developer Utilities',
        'nav'         => 'JSON Formatter',
        'title'       => 'JSON Formatter, Validator & Minifier Online - Free',
        'h1'          => 'JSON formatter and validator',
        'description' => 'Beautify, minify and validate JSON with precise error positions, sorting and a collapsible tree view. Everything runs client side, so private payloads stay on your machine.',
        'keywords'    => 'json formatter, json validator, json beautifier, json minify',
        'intro'       => 'Paste any JSON document to pretty print it with two or four space indentation, minify it for production, sort keys alphabetically, or jump straight to the line and column of a syntax error.',
        'faq'         => [
            ['Does it support JSONC or trailing commas?', 'Strict JSON only, matching JSON.parse, so what validates here validates in your runtime.'],
            ['Is my data uploaded?', 'Never. The parser is the browser built in JSON engine.'],
        ],
    ],

    'url-encoder' => [
        'slug'        => 'url-encoder',
        'category'    => 'Developer Utilities',
        'nav'         => 'URL Encode / Decode',
        'title'       => 'URL Encoder and Decoder Online - Percent Encoding Tool',
        'h1'          => 'URL encoder and decoder',
        'description' => 'Percent encode or decode URLs, query strings and form components online. Choose between encodeURI and encodeURIComponent semantics and inspect every parsed query parameter.',
        'keywords'    => 'url encode, url decode, percent encoding, query string parser',
        'intro'       => 'Switch between whole URL escaping and component escaping, then use the query inspector to see each key and value decoded into a readable table.',
        'faq'         => [
            ['encodeURI or encodeURIComponent?', 'Use encodeURI for a complete address and encodeURIComponent for a single parameter value.'],
            ['Why did my plus sign become a space?', 'Legacy form encoding treats + as a space. Toggle the form encoding option to reproduce it.'],
        ],
    ],

    'jwt-decoder' => [
        'slug'        => 'jwt-decoder',
        'category'    => 'Developer Utilities',
        'nav'         => 'JWT Decoder',
        'title'       => 'JWT Decoder Online - Inspect JSON Web Token Header & Payload',
        'h1'          => 'JWT (JSON Web Token) decoder',
        'description' => 'Decode the header and payload of any JSON Web Token in your browser, with human readable exp, iat and nbf timestamps and a live expiry warning. Tokens are never transmitted.',
        'keywords'    => 'jwt decoder, decode json web token, jwt debugger, jwt payload',
        'intro'       => 'Paste a token to split it into header, payload and signature. Registered claims such as exp, iat, nbf and aud are rendered as local dates so you can spot an expired session immediately.',
        'faq'         => [
            ['Does it verify the signature?', 'No. Verification needs your secret or public key, and we will never ask you to paste a signing key into a website.'],
            ['Is my token sent anywhere?', 'No. Decoding is pure JavaScript in your tab.'],
        ],
    ],

    /* ----------------------------------------------------------------- */
    /* 5. Day-to-day & business                                           */
    /* ----------------------------------------------------------------- */
    'qr-generator' => [
        'slug'        => 'qr-generator',
        'category'    => 'Business & Daily Tools',
        'nav'         => 'QR Code Generator',
        'title'       => 'QR Code Generator - Download PNG or SVG, No Watermark',
        'h1'          => 'QR code generator',
        'description' => 'Create a QR code from any URL, text, phone number or WiFi credential and download it as a transparent PNG or an infinitely scalable SVG. Free, unlimited and watermark free.',
        'keywords'    => 'qr code generator, free qr code, qr png, qr svg download',
        'intro'       => 'Pick the size, margin, foreground and background colours and the error correction level, then export a raster PNG for social posts or a vector SVG for print. Generation uses qrcode.js in the browser, so there are zero server costs and zero tracking.',
        'faq'         => [
            ['Do the codes expire?', 'No. These are static QR codes, the data is encoded in the image itself, so they work forever.'],
            ['Which error correction level should I use?', 'Level H survives about 30 percent damage and is the right choice for printed material or logos.'],
        ],
    ],

    'barcode-generator' => [
        'slug'        => 'barcode-generator',
        'category'    => 'Business & Daily Tools',
        'nav'         => 'Barcode Generator',
        'title'       => 'Barcode Generator Online - EAN-13, UPC, CODE128, ITF',
        'h1'          => 'Barcode generator',
        'description' => 'Generate CODE128, CODE39, EAN-13, EAN-8, UPC, ITF-14, MSI and Pharmacode barcodes and download them as PNG or SVG. Built on JsBarcode and runs entirely in your browser.',
        'keywords'    => 'barcode generator, ean 13 generator, code128, upc barcode maker',
        'intro'       => 'Choose a symbology, type the value, and the barcode is drawn live with a checksum validation warning if the value does not match the format rules.',
        'faq'         => [
            ['Which format do retailers use?', 'EAN-13 outside North America and UPC-A inside it. Both need a valid check digit.'],
            ['Can I print these?', 'Yes, export the SVG for lossless printing at any label size.'],
        ],
    ],

    'word-counter' => [
        'slug'        => 'word-counter',
        'category'    => 'Business & Daily Tools',
        'nav'         => 'Word & Reading Time',
        'title'       => 'Word Counter, Character Counter & Reading Time Calculator',
        'h1'          => 'Word, character and reading time counter',
        'description' => 'Count words, characters with and without spaces, sentences, paragraphs and unique words, plus estimated reading and speaking time. Live, offline and free.',
        'keywords'    => 'word counter, character count, reading time calculator, text statistics',
        'intro'       => 'Type or paste your draft to see live statistics, keyword density and an estimated reading time at 200, 250 or 300 words per minute, which is handy for blog posts and conference talks.',
        'faq'         => [
            ['What reading speed do you assume?', 'Two hundred and thirty words per minute by default, adjustable in the panel.'],
            ['Does it count in other languages?', 'Yes. Word splitting uses Unicode aware boundaries.'],
        ],
    ],

    'password-generator' => [
        'slug'        => 'password-generator',
        'category'    => 'Business & Daily Tools',
        'nav'         => 'Password Generator',
        'title'       => 'Secure Password Generator - Cryptographically Random',
        'h1'          => 'Secure password generator',
        'description' => 'Generate strong random passwords and passphrases with crypto.getRandomValues, with live entropy scoring in bits and an estimated offline cracking time. Nothing is logged.',
        'keywords'    => 'password generator, random password, strong password, passphrase generator',
        'intro'       => 'Randomness comes from the CSPRNG built into your browser, never from Math.random. Choose a character password or a memorable diceware style passphrase and watch the entropy update as you tune the options.',
        'faq'         => [
            ['How many bits of entropy are enough?', 'Aim for at least 75 bits for accounts that matter and 100 or more for master passwords.'],
            ['Are generated passwords sent to a server?', 'No. There is no network request anywhere in this tool.'],
        ],
    ],

    /* ----------------------------------------------------------------- */
    /* 6. AI tools (PHP proxy)                                            */
    /* ----------------------------------------------------------------- */
    'text-summarizer' => [
        'slug'        => 'text-summarizer',
        'category'    => 'AI Tools',
        'nav'         => 'Text Summarizer',
        'title'       => 'AI Text Summarizer - Free Article & Document Summary Tool',
        'h1'          => 'AI text summarizer',
        'description' => 'Paste an article, report or transcript and get a concise summary, bullet key points or a one line abstract. Requests are proxied through a PHP endpoint so the API key stays server side.',
        'keywords'    => 'ai summarizer, text summary tool, article summarizer, tldr generator',
        'intro'       => 'Choose the output style and length, then let the model condense the text. The browser only ever talks to /api/ai.php on this domain, which is where the provider key lives.',
        'faq'         => [
            ['How long can the input be?', 'Roughly 12000 characters per request, which is about 3000 words.'],
            ['Is my text stored?', 'The proxy does not log request bodies. Check your AI provider retention policy for their side.'],
        ],
    ],

    'code-explainer' => [
        'slug'        => 'code-explainer',
        'category'    => 'AI Tools',
        'nav'         => 'Code Explainer',
        'title'       => 'AI Code Explainer - Understand Any Code Snippet in Plain English',
        'h1'          => 'AI code snippet explainer',
        'description' => 'Paste a function in any language and get a line by line plain English explanation, the time complexity and likely edge cases. Great for code review and onboarding.',
        'keywords'    => 'explain code, ai code explainer, code documentation generator',
        'intro'       => 'Select the language, choose beginner or expert depth, and receive a structured walkthrough of what the snippet does, why it does it and where it can break.',
        'faq'         => [
            ['Which languages are supported?', 'Anything the underlying model knows, which in practice covers every mainstream language.'],
            ['Do you keep my code?', 'No. The PHP proxy forwards the request and returns the answer without persisting either.'],
        ],
    ],
];
