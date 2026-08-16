<?php
/**
 * api/convert.php - document conversion proxy (PDF <-> Word)
 * ---------------------------------------------------------------------------
 * POST multipart/form-data:  file, source, target
 *
 * Default vendor is CloudConvert v2. The whole exchange happens server side:
 *   1. create a job  (import/upload -> convert -> export/url)
 *   2. upload the temporary file to the signed form CloudConvert returns
 *   3. poll the job until it finishes
 *   4. hand the browser only the short lived export URL
 *
 * The API key never reaches the browser, and the temporary upload is removed
 * in a finally block whatever happens.
 */

declare(strict_types=1);
require __DIR__ . '/../config/bootstrap.php';

require_method('POST');
rate_limit('convert', 8);

const MAX_BYTES = 20 * 1024 * 1024;

$allowed = [
    'pdf'  => ['docx'],
    'docx' => ['pdf'],
];

$source = strtolower(preg_replace('/[^a-z0-9]/i', '', (string) ($_POST['source'] ?? '')));
$target = strtolower(preg_replace('/[^a-z0-9]/i', '', (string) ($_POST['target'] ?? '')));

if (!isset($allowed[$source]) || !in_array($target, $allowed[$source], true)) {
    fail('Unsupported conversion.', 422);
}

if (!isset($_FILES['file']) || ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    fail('No file was received. It may be larger than the server upload limit.', 400);
}

$upload = $_FILES['file'];
if ((int) $upload['size'] > MAX_BYTES) {
    fail('That file is larger than 20 MB.', 413);
}

$extension = strtolower(pathinfo((string) $upload['name'], PATHINFO_EXTENSION));
$acceptable = $source === 'pdf' ? ['pdf'] : ['doc', 'docx', 'odt', 'rtf'];
if (!in_array($extension, $acceptable, true)) {
    fail('Expected one of: ' . implode(', ', $acceptable), 422);
}

// Verify the real MIME type, not just the file name.
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = (string) $finfo->file($upload['tmp_name']);
$mimeWhitelist = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'application/rtf',
    'text/rtf',
    'application/zip', // docx / odt are zip containers on some systems
];
if (!in_array($mime, $mimeWhitelist, true)) {
    fail('That file does not look like a real ' . strtoupper($source) . ' document (' . $mime . ').', 422);
}

$apiKey = (string) env('CONVERT_API_KEY', '');
if ($apiKey === '' || $apiKey === 'replace-me') {
    fail('The conversion provider is not configured yet. Add CONVERT_API_KEY to config/secrets.php.', 503);
}

$workFile = tempnam(sys_get_temp_dir(), 'wus');
if ($workFile === false) {
    fail('Server temporary storage is unavailable.', 500);
}

try {
    if (!move_uploaded_file($upload['tmp_name'], $workFile)) {
        fail('Could not store the upload.', 500);
    }

    $result = cloudconvert($workFile, (string) $upload['name'], $extension, $target, $apiKey);
    ok($result);
} finally {
    if (is_file($workFile)) {
        @unlink($workFile);
    }
}

/* -------------------------------------------------------------- functions */

function cloudconvert(string $path, string $originalName, string $inputFormat, string $target, string $apiKey): array
{
    $base    = rtrim((string) env('CONVERT_API_BASE', 'https://api.cloudconvert.com/v2'), '/');
    $headers = ['Authorization: Bearer ' . $apiKey];

    /* 1. create the job ---------------------------------------------------- */
    $job = http_json('POST', $base . '/jobs', [
        'tasks' => [
            'import-1' => ['operation' => 'import/upload'],
            'convert-1' => [
                'operation'     => 'convert',
                'input'         => 'import-1',
                'input_format'  => $inputFormat,
                'output_format' => $target,
                'engine_version' => null,
            ],
            'export-1' => [
                'operation'    => 'export/url',
                'input'        => 'convert-1',
                'inline'       => false,
                'archive_multiple_files' => false,
            ],
        ],
    ], $headers, 30);

    if ($job['status'] < 200 || $job['status'] >= 300) {
        error_log('[convert] job creation failed: ' . $job['status']);
        fail('The conversion service rejected the job.', 502);
    }

    $jobId = $job['json']['data']['id'] ?? '';
    $uploadTask = null;
    foreach (($job['json']['data']['tasks'] ?? []) as $task) {
        if (($task['name'] ?? '') === 'import-1') {
            $uploadTask = $task;
        }
    }

    $form = $uploadTask['result']['form'] ?? null;
    if (!$form) {
        fail('The conversion service did not return an upload target.', 502);
    }

    /* 2. upload the file to the signed form -------------------------------- */
    $fields = [];
    foreach (($form['parameters'] ?? []) as $key => $value) {
        $fields[$key] = $value;
    }
    $fields['file'] = new CURLFile($path, mime_content_type($path) ?: 'application/octet-stream', $originalName);

    $uploadRes = http_request('POST', (string) $form['url'], ['body' => $fields, 'timeout' => 120]);
    if ($uploadRes['status'] < 200 || $uploadRes['status'] >= 400) {
        fail('Uploading the document to the converter failed.', 502);
    }

    /* 3. poll until the job finishes --------------------------------------- */
    $deadline = time() + 110;
    $exportUrl = null;
    $filename  = null;

    while (time() < $deadline) {
        usleep(1500000);
        $status = http_json('GET', $base . '/jobs/' . rawurlencode($jobId), null, $headers, 20);
        $state  = $status['json']['data']['status'] ?? '';

        if ($state === 'error') {
            fail('The converter could not process this document.', 422);
        }
        if ($state === 'finished') {
            foreach (($status['json']['data']['tasks'] ?? []) as $task) {
                foreach (($task['result']['files'] ?? []) as $file) {
                    if (!empty($file['url'])) {
                        $exportUrl = (string) $file['url'];
                        $filename  = (string) ($file['filename'] ?? 'converted.' . $target);
                    }
                }
            }
            break;
        }
    }

    if (!$exportUrl) {
        fail('The conversion timed out. Please try a smaller document.', 504);
    }

    return [
        'url'      => $exportUrl,
        'filename' => $filename ?: ('converted.' . $target),
        'mime'     => $target === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
}
