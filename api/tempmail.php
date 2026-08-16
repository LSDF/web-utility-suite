<?php
/**
 * api/tempmail.php - disposable inbox proxy (default provider: mail.tm)
 * ---------------------------------------------------------------------------
 * POST { "action": "create" }
 * POST { "action": "messages", "token": "...", "id": "..." }
 * POST { "action": "message",  "token": "...", "id": "<messageId>" }
 *
 * The upstream provider only ever sees this server, never the visitor. The
 * inbox password is generated here with random_bytes and returned to nobody.
 */

declare(strict_types=1);
require __DIR__ . '/../config/bootstrap.php';

require_method('POST');
rate_limit('tempmail', 40);

$body   = json_body(20000);
$action = (string) ($body['action'] ?? '');
$base   = rtrim((string) env('TEMPMAIL_API_BASE', 'https://api.mail.tm'), '/');

switch ($action) {
    case 'create':   ok(create_inbox($base));                                        break;
    case 'messages': ok(list_messages($base, (string) ($body['token'] ?? '')));       break;
    case 'message':  ok(read_message($base, (string) ($body['token'] ?? ''), (string) ($body['id'] ?? ''))); break;
    default:         fail('Unknown action.', 422);
}

/* -------------------------------------------------------------- functions */

function pick_domain(string $base): string
{
    $res = http_json('GET', $base . '/domains?page=1');
    $domains = $res['json']['hydra:member'] ?? $res['json'] ?? [];

    foreach ($domains as $domain) {
        if (!empty($domain['isActive']) && empty($domain['isPrivate'])) {
            return (string) $domain['domain'];
        }
    }
    fail('No disposable mail domain is available right now. Please retry.', 503);
}

function random_local_part(): string
{
    return 'wus' . bin2hex(random_bytes(5));
}

function create_inbox(string $base): array
{
    $domain  = pick_domain($base);
    $address = random_local_part() . '@' . $domain;
    $password = bin2hex(random_bytes(16));

    $created = http_json('POST', $base . '/accounts', [
        'address'  => $address,
        'password' => $password,
    ]);

    if ($created['status'] < 200 || $created['status'] >= 300) {
        error_log('[tempmail] account creation failed: ' . $created['status']);
        fail('Could not create a disposable inbox right now.', 502);
    }

    $auth = http_json('POST', $base . '/token', [
        'address'  => $address,
        'password' => $password,
    ]);

    $token = $auth['json']['token'] ?? '';
    if ($token === '') {
        fail('Inbox created but authentication failed. Please try again.', 502);
    }

    return [
        'address' => $address,
        'id'      => $created['json']['id'] ?? '',
        // Short lived provider token. It only grants access to this throwaway
        // mailbox, which is why it is safe to hand back to the browser.
        'token'   => $token,
    ];
}

function guard_token(string $token): void
{
    if ($token === '' || strlen($token) > 4096 || !preg_match('/^[A-Za-z0-9\.\-_]+$/', $token)) {
        fail('Missing or malformed session token.', 401);
    }
}

function list_messages(string $base, string $token): array
{
    guard_token($token);

    $res = http_json('GET', $base . '/messages?page=1', null, ['Authorization: Bearer ' . $token], 20);
    if ($res['status'] === 401) {
        fail('This inbox has expired. Generate a new address.', 401);
    }

    $items = $res['json']['hydra:member'] ?? $res['json'] ?? [];
    $out = [];

    foreach ($items as $item) {
        $from = $item['from']['address'] ?? '';
        $name = $item['from']['name'] ?? '';
        $out[] = [
            'id'      => (string) ($item['id'] ?? ''),
            'subject' => (string) ($item['subject'] ?? ''),
            'from'    => trim($name . ' <' . $from . '>', ' <>'),
            'date'    => isset($item['createdAt']) ? date('H:i:s', strtotime((string) $item['createdAt'])) : '',
            'seen'    => (bool) ($item['seen'] ?? false),
        ];
    }

    return ['messages' => $out];
}

function read_message(string $base, string $token, string $id): array
{
    guard_token($token);
    if ($id === '' || !preg_match('/^[A-Za-z0-9\-_]+$/', $id)) {
        fail('Invalid message id.', 422);
    }

    $res = http_json('GET', $base . '/messages/' . rawurlencode($id), null, ['Authorization: Bearer ' . $token], 20);
    if ($res['status'] < 200 || $res['status'] >= 300) {
        fail('Could not load that message.', 502);
    }

    $json = $res['json'] ?? [];
    $html = $json['html'] ?? [];
    $htmlText = is_array($html) ? implode("\n", $html) : (string) $html;

    return [
        'id'      => $id,
        'subject' => (string) ($json['subject'] ?? ''),
        // Plain text only: never hand raw provider HTML back to the DOM.
        'text'    => (string) ($json['text'] ?? strip_tags($htmlText)),
    ];
}
