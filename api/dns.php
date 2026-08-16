<?php
/**
 * api/dns.php - IP + DNS record lookup proxy
 * ---------------------------------------------------------------------------
 * POST { "query": "example.com", "types": ["A","MX","TXT"] }
 *
 * Resolution order:
 *   1. dns_get_record() when the host allows it (Hostinger does)
 *   2. DNS over HTTPS via Cloudflare 1.1.1.1 as a fallback
 *
 * Hardening: hostname format validation, private / reserved IP ranges rejected
 * (SSRF), per IP rate limiting, and a hard cap on the number of record types.
 */

declare(strict_types=1);
require __DIR__ . '/../config/bootstrap.php';

require_method('POST');
rate_limit('dns', 30);

$body  = json_body();
$query = strtolower(trim((string) ($body['query'] ?? '')));
$types = $body['types'] ?? ['A', 'AAAA', 'MX', 'TXT', 'NS'];

if ($query === '') {
    fail('Please provide a domain name or an IP address.');
}

$allowedTypes = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA'];
$types = array_values(array_intersect(
    array_map('strtoupper', array_map('strval', (array) $types)),
    $allowedTypes
));
if (!$types) {
    $types = ['A'];
}
$types = array_slice($types, 0, 8);

$response = ['query' => $query, 'ip' => null, 'records' => []];

/* --------------------------------------------------------------- IP input */

if (filter_var($query, FILTER_VALIDATE_IP)) {
    if (!is_public_ip($query)) {
        fail('Private, loopback and reserved ranges cannot be looked up.', 422);
    }
    $response['ip'] = ip_details($query);
    $ptr = @gethostbyaddr($query);
    if ($ptr && $ptr !== $query) {
        $response['records']['PTR'] = [['host' => $query, 'target' => $ptr]];
    }
    ok($response);
}

/* ----------------------------------------------------------- domain input */

if (!is_valid_hostname($query)) {
    fail('That does not look like a valid domain name.', 422);
}

foreach ($types as $type) {
    $records = resolve_records($query, $type);
    if ($records) {
        $response['records'][$type] = $records;
    }
}

// Convenience: resolve the apex A record to geo data as well.
if (!empty($response['records']['A'][0]['value'])) {
    $firstIp = $response['records']['A'][0]['value'];
    if (is_public_ip($firstIp)) {
        $response['ip'] = ip_details($firstIp);
    }
}

ok($response);

/* -------------------------------------------------------------- functions */

function resolve_records(string $host, string $type): array
{
    $constants = [
        'A' => DNS_A, 'AAAA' => DNS_AAAA, 'CNAME' => DNS_CNAME, 'MX' => DNS_MX,
        'NS' => DNS_NS, 'TXT' => DNS_TXT, 'SOA' => DNS_SOA, 'CAA' => DNS_CAA,
    ];

    $rows = [];

    if (function_exists('dns_get_record') && isset($constants[$type])) {
        $raw = @dns_get_record($host, $constants[$type]);
        if (is_array($raw) && $raw) {
            foreach ($raw as $record) {
                $rows[] = normalise_record($record, $type);
            }
            return $rows;
        }
    }

    return resolve_doh($host, $type);
}

function normalise_record(array $record, string $type): array
{
    $value = '';
    switch ($type) {
        case 'A':     $value = $record['ip'] ?? ''; break;
        case 'AAAA':  $value = $record['ipv6'] ?? ''; break;
        case 'MX':    $value = ($record['pri'] ?? '') . ' ' . ($record['target'] ?? ''); break;
        case 'CNAME':
        case 'NS':    $value = $record['target'] ?? ''; break;
        case 'TXT':   $value = $record['txt'] ?? ''; break;
        case 'CAA':   $value = ($record['flags'] ?? '') . ' ' . ($record['tag'] ?? '') . ' ' . ($record['value'] ?? ''); break;
        case 'SOA':
            $value = trim(($record['mname'] ?? '') . ' ' . ($record['rname'] ?? '') . ' serial ' . ($record['serial'] ?? ''));
            break;
        default:      $value = json_encode($record);
    }

    return [
        'host'  => $record['host'] ?? '',
        'ttl'   => $record['ttl'] ?? '',
        'value' => trim((string) $value),
    ];
}

/** DNS over HTTPS fallback (Cloudflare, no key required). */
function resolve_doh(string $host, string $type): array
{
    $url = 'https://cloudflare-dns.com/dns-query?name=' . rawurlencode($host) . '&type=' . rawurlencode($type);
    $res = http_request('GET', $url, [
        'headers' => ['Accept: application/dns-json'],
        'timeout' => 12,
    ]);

    if ($res['status'] !== 200) {
        return [];
    }

    $json = json_decode($res['body'], true);
    $rows = [];
    foreach (($json['Answer'] ?? []) as $answer) {
        $rows[] = [
            'host'  => rtrim((string) ($answer['name'] ?? ''), '.'),
            'ttl'   => $answer['TTL'] ?? '',
            'value' => trim((string) ($answer['data'] ?? ''), '"'),
        ];
    }
    return $rows;
}

/** Geolocation / ASN lookup (keyless endpoint, swap for MaxMind if preferred). */
function ip_details(string $ip): array
{
    $fields = 'status,country,countryCode,regionName,city,zip,timezone,isp,org,as,reverse,query';
    $res = http_request('GET', 'http://ip-api.com/json/' . rawurlencode($ip) . '?fields=' . $fields, ['timeout' => 8]);
    $json = json_decode($res['body'], true);

    if (!is_array($json) || ($json['status'] ?? '') !== 'success') {
        return ['ip' => $ip];
    }

    return [
        'ip'       => $json['query'] ?? $ip,
        'reverse'  => $json['reverse'] ?? '',
        'country'  => trim(($json['country'] ?? '') . ' (' . ($json['countryCode'] ?? '') . ')'),
        'region'   => $json['regionName'] ?? '',
        'city'     => $json['city'] ?? '',
        'timezone' => $json['timezone'] ?? '',
        'isp'      => $json['isp'] ?? '',
        'asn'      => $json['as'] ?? '',
    ];
}
