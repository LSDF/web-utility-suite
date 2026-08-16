<?php
/**
 * config/secrets.sample.php
 * ---------------------------------------------------------------------------
 * Copy this file to config/secrets.php on the server and fill in real values.
 *
 *   cp config/secrets.sample.php config/secrets.php
 *
 * config/secrets.php is git-ignored and is additionally blocked by .htaccess,
 * so the keys below are NEVER reachable from the browser and never appear in
 * any JavaScript bundle.
 *
 * On Hostinger you can also set these as real environment variables in
 * hPanel > Advanced > PHP Configuration; env() checks getenv() first.
 */

return [

    // ----------------------------------------------------------------- AI
    // Any OpenAI-compatible endpoint works (OpenAI, Groq, Together, OpenRouter,
    // Mistral, a self-hosted vLLM ...). Only the base URL and model change.
    'AI_API_BASE'  => 'https://api.openai.com/v1',
    'AI_API_KEY'   => 'sk-replace-me',
    'AI_MODEL'     => 'gpt-4o-mini',

    // -------------------------------------------------- Document conversion
    // Example: CloudConvert (https://cloudconvert.com/api/v2) or ConvertAPI.
    'CONVERT_PROVIDER' => 'cloudconvert',
    'CONVERT_API_KEY'  => 'replace-me',
    'CONVERT_API_BASE' => 'https://api.cloudconvert.com/v2',

    // ------------------------------------------------------ Temporary email
    // mail.tm is free and needs no key; 1secmail is a keyless fallback.
    'TEMPMAIL_PROVIDER' => 'mail.tm',
    'TEMPMAIL_API_BASE' => 'https://api.mail.tm',

    // ------------------------------------------------------------- Hardening
    // Requests per IP per minute for every /api endpoint.
    'RATE_LIMIT_PER_MIN' => 20,
    // Only these origins may call the API (leave empty to allow same-origin only).
    'ALLOWED_ORIGINS'    => [],
    // Absolute canonical origin, used for OG tags and the sitemap.
    'SITE_URL'           => 'https://example.com',
];
