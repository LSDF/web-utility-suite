<?php
/**
 * config/bootstrap.php
 * ---------------------------------------------------------------------------
 * Shared runtime for every /api/*.php endpoint.
 * Loaded with:  require __DIR__ . '/../config/bootstrap.php';
 */

declare(strict_types=1);

if (!defined('WUS_ROOT')) {
    define('WUS_ROOT', dirname(__DIR__));
}

/* -------------------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------------- */

function wus_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $defaults = require WUS_ROOT . '/config/secrets.sample.php';
    $local    = [];
    $file     = WUS_ROOT . '/config/secrets.php';

    if (is_readable($file)) {
        $loaded = require $file;
        if (is_array($loaded)) {
            $local = $loaded;
        }
    }

    $config = array_merge($defaults, $local);
    return $config;
}

/**
 * Environment variables win over the file, so Hostinger hPanel / GitHub
 * Actions secrets can override anything without touching the code.
 */
function env(string $key, $fallback = null)
{
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    $config = wus_config();
    return $config[$key] ?? $fallback;
}

/* -------------------------------------------------------------------------
 * Request / response helpers
 * ---------------------------------------------------------------------- */

function wus_send_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');

    $allowed = env('ALLOWED_ORIGINS', []);
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (is_array($allowed) && $origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
}

function json_out($payload, int $status = 200): void
{
    http_response_code($status);
    wus_send_headers();
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): void
{
    json_out(array_merge(['ok' => false, 'error' => $message], $extra), $status);
}

function ok($data = null, array $extra = []): void
{
    json_out(array_merge(['ok' => true, 'data' => $data], $extra));
}

function require_method(string ...$methods): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'OPTIONS') {
        wus_send_headers();
        header('Access-Control-Allow-Methods: ' . implode(', ', $methods));
        header('Access-Control-Allow-Headers: Content-Type');
        http_response_code(204);
        exit;
    }
    if (!in_array($method, $methods, true)) {
        fail('Method not allowed', 405);
    }
}

/** Read and decode a JSON request body with a hard size cap. */
function json_body(int $maxBytes = 200000): array
{
    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false || $raw === '') {
        return [];
    }
    if (strlen($raw) > $maxBytes) {
        fail('Request body too large', 413);
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function client_ip(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $candidate = trim(explode(',', (string) $_SERVER[$key])[0]);
            if (filter_var($candidate, FILTER_VALIDATE_IP)) {
                return $candidate;
            }
        }
    }
    return '0.0.0.0';
}

/* -------------------------------------------------------------------------
 * Very small file based rate limiter (no database needed on shared hosting)
 * ---------------------------------------------------------------------- */

function rate_limit(string $bucket, ?int $perMinute = null): void
{
    $limit = (int) ($perMinute ?? env('RATE_LIMIT_PER_MIN', 20));
    if ($limit <= 0) {
        return;
    }

    $dir = sys_get_temp_dir() . '/wus-rl';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }

    $key  = $bucket . '|' . client_ip() . '|' . gmdate('YmdHi');
    $path = $dir . '/' . sha1($key) . '.cnt';

    $count = 0;
    $fh = @fopen($path, 'c+');
    if ($fh === false) {
        return; // fail open rather than break the tool
    }
    if (flock($fh, LOCK_EX)) {
        $count = (int) stream_get_contents($fh);
        $count++;
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, (string) $count);
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);

    // opportunistic cleanup
    if (random_int(1, 50) === 1) {
        foreach (glob($dir . '/*.cnt') ?: [] as $old) {
            if (filemtime($old) < time() - 300) {
                @unlink($old);
            }
        }
    }

    if ($count > $limit) {
        header('Retry-After: 60');
        fail('Rate limit reached. Please wait a minute and try again.', 429);
    }
}

/* -------------------------------------------------------------------------
 * Outbound HTTP (cURL) - the only place that ever sees an API key
 * ---------------------------------------------------------------------- */

function http_request(string $method, string $url, array $options = []): array
{
    $headers  = $options['headers'] ?? [];
    $body     = $options['body'] ?? null;
    $timeout  = (int) ($options['timeout'] ?? 60);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => strtoupper($method),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_USERAGENT      => 'WebUtilitySuite/1.0 (+PHP proxy)',
    ]);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);
    $status   = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['status' => 0, 'body' => '', 'error' => $error ?: 'Upstream request failed'];
    }

    return ['status' => $status, 'body' => (string) $response, 'error' => null];
}

function http_json(string $method, string $url, array $payload = null, array $headers = [], int $timeout = 60): array
{
    $headers[] = 'Accept: application/json';
    $body = null;
    if ($payload !== null) {
        $headers[] = 'Content-Type: application/json';
        $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    $res = http_request($method, $url, ['headers' => $headers, 'body' => $body, 'timeout' => $timeout]);
    $res['json'] = json_decode($res['body'], true);
    return $res;
}

/* -------------------------------------------------------------------------
 * SSRF guard - used by the DNS / IP lookup tool
 * ---------------------------------------------------------------------- */

function is_public_ip(string $ip): bool
{
    return (bool) filter_var(
        $ip,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    );
}

function is_valid_hostname(string $host): bool
{
    if ($host === '' || strlen($host) > 253) {
        return false;
    }
    return (bool) preg_match('/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i', $host);
}
