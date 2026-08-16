<?php
/**
 * api/ai.php - AI proxy for the Text Summarizer and Code Explainer
 * ---------------------------------------------------------------------------
 * POST { "task": "summarize" | "explain-code", "input": "...",
 *        "optionA": "...", "optionB": "..." }
 *
 * Works with ANY OpenAI compatible chat completions endpoint (OpenAI, Groq,
 * Together, OpenRouter, Mistral, self hosted vLLM). Configure AI_API_BASE,
 * AI_API_KEY and AI_MODEL in config/secrets.php - the key never leaves PHP.
 */

declare(strict_types=1);
require __DIR__ . '/../config/bootstrap.php';

require_method('POST');
rate_limit('ai', 12);

$body    = json_body(60000);
$task    = (string) ($body['task'] ?? '');
$input   = trim((string) ($body['input'] ?? ''));
$optionA = preg_replace('/[^a-z0-9\-]/i', '', (string) ($body['optionA'] ?? ''));
$optionB = preg_replace('/[^a-z0-9\-]/i', '', (string) ($body['optionB'] ?? ''));

if ($input === '') {
    fail('Nothing to process.');
}
if (mb_strlen($input) > 12000) {
    fail('Input is too long. Please keep it under 12000 characters.', 413);
}

$apiKey = (string) env('AI_API_KEY', '');
if ($apiKey === '' || $apiKey === 'sk-replace-me') {
    fail('The AI provider is not configured yet. Add AI_API_KEY to config/secrets.php.', 503);
}

$prompt = build_prompt($task, $optionA, $optionB);
if ($prompt === null) {
    fail('Unknown task.', 422);
}

$base  = rtrim((string) env('AI_API_BASE', 'https://api.openai.com/v1'), '/');
$model = (string) env('AI_MODEL', 'gpt-4o-mini');

$res = http_json('POST', $base . '/chat/completions', [
    'model'       => $model,
    'temperature' => 0.2,
    'max_tokens'  => 1200,
    'messages'    => [
        ['role' => 'system', 'content' => $prompt],
        ['role' => 'user',   'content' => $input],
    ],
], ['Authorization: Bearer ' . $apiKey], 90);

if ($res['status'] === 429) {
    fail('The AI provider is rate limiting us. Please retry shortly.', 429);
}
if ($res['status'] < 200 || $res['status'] >= 300) {
    // Never leak the upstream body: it can echo the Authorization header.
    error_log('[ai.php] upstream status ' . $res['status']);
    fail('The AI service is unavailable right now.', 502);
}

$output = $res['json']['choices'][0]['message']['content'] ?? '';
if ($output === '') {
    fail('The model returned an empty response.', 502);
}

ok([
    'output' => $output,
    'model'  => $model,
    'usage'  => $res['json']['usage'] ?? null,
]);

/* -------------------------------------------------------------- functions */

function build_prompt(string $task, string $optionA, string $optionB): ?string
{
    if ($task === 'summarize') {
        $styles = [
            'bullets'   => 'Return 4 to 7 concise bullet points, one insight each.',
            'paragraph' => 'Return a single tight paragraph.',
            'tldr'      => 'Return exactly one sentence, under 30 words.',
            'executive' => 'Return an executive summary: one headline sentence, then 3 bullets covering impact, risk and next step.',
            'eli5'      => 'Explain it in very simple language a twelve year old would follow.',
        ];
        $lengths = [
            'short'    => 'Be extremely brief.',
            'medium'   => 'Aim for a medium length answer.',
            'detailed' => 'Be thorough, but never pad.',
        ];

        return 'You are a precise summarization engine. '
            . ($styles[$optionA] ?? $styles['bullets']) . ' '
            . ($lengths[$optionB] ?? $lengths['medium']) . ' '
            . 'Preserve numbers, names and dates exactly. Never invent facts that are not in the source. '
            . 'Reply in the same language as the input. Output plain markdown with no preamble.';
    }

    if ($task === 'explain-code') {
        $depths = [
            'beginner' => 'Assume the reader is new to programming. Avoid jargon, define terms you must use.',
            'standard' => 'Assume a working developer. Be direct.',
            'expert'   => 'Assume a senior engineer. Include time and space complexity, edge cases, thread safety and security pitfalls.',
        ];
        $language = ($optionA === '' || $optionA === 'auto') ? 'Detect the language yourself.' : 'The language is ' . $optionA . '.';

        return 'You are a senior software engineer explaining a snippet during code review. ' . $language . ' '
            . ($depths[$optionB] ?? $depths['standard']) . ' '
            . 'Structure the answer as markdown: a one line summary, a short step by step walkthrough, '
            . 'then Complexity, Edge cases and Suggestions sections. '
            . 'Never execute, never fabricate APIs, and if the snippet looks malicious say so and stop.';
    }

    return null;
}
