<?php
/**
 * api/download.php - hands back one converted file, then deletes it.
 *
 * Usage:  /api/download.php?t=<32 hex chars>
 *
 * The token is random, single use and expires after 15 minutes, so a converted
 * document is never guessable and never lingers on the server.
 */

declare(strict_types=1);
require __DIR__ . '/../config/bootstrap.php';

require_method('GET');

$token = (string) ($_GET['t'] ?? '');
if (!preg_match('/^[a-f0-9]{32}$/', $token)) {
    fail('Invalid download token.', 400);
}

$storage  = WUS_ROOT . '/storage/tmp';
$metaPath = $storage . '/' . $token . '.json';

if (!is_file($metaPath)) {
    fail('This download link has expired. Please convert the file again.', 410);
}

$meta = json_decode((string) file_get_contents($metaPath), true);
if (!is_array($meta) || ($meta['expires'] ?? 0) < time()) {
    @unlink($metaPath);
    fail('This download link has expired. Please convert the file again.', 410);
}

$candidates = glob($storage . '/' . $token . '.*') ?: [];
$filePath = null;
foreach ($candidates as $candidate) {
    if (substr($candidate, -5) !== '.json') {
        $filePath = $candidate;
    }
}

if ($filePath === null || !is_file($filePath)) {
    @unlink($metaPath);
    fail('The converted file is no longer available.', 410);
}

$filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', (string) ($meta['filename'] ?? 'download'));

header('Content-Type: ' . ($meta['mime'] ?? 'application/octet-stream'));
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . filesize($filePath));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, private');

readfile($filePath);

/* Single use: the bytes are gone the moment they have been served. */
@unlink($filePath);
@unlink($metaPath);
exit;
