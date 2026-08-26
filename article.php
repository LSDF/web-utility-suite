<?php
declare(strict_types=1);
require __DIR__ . '/config/bootstrap.php';

$routes = require __DIR__ . '/config/routes.php';
$extraPages = __DIR__ . '/config/pages.php';
if (is_file($extraPages)) {
    $routes = array_replace($routes, require $extraPages);
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$slug = strtolower(preg_replace('/[^a-z0-9\-]/i', '', trim((string) $path, '/')));

if (!isset($routes[$slug]) || (($routes[$slug]['type'] ?? '') !== 'page')) {
    header('Location: /', true, 302);
    exit;
}

$route = $routes[$slug];
$siteName = 'Shehanly';
$siteUrl = rtrim((string) env('SITE_URL', 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')), '/');
$canonical = $siteUrl . '/' . $route['slug'];

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function render_body_block($block): void
{
    if (is_string($block)) {
        echo '<p class="text-sm leading-relaxed text-slate-600 dark:text-slate-400">' . e($block) . '</p>';
        return;
    }
    if (!is_array($block)) {
        return;
    }
    if (!empty($block['h2'])) {
        echo '<h2 class="pt-2 text-xl font-semibold text-slate-900 dark:text-white">' . e((string) $block['h2']) . '</h2>';
        return;
    }
    if (!empty($block['h3'])) {
        echo '<h3 class="pt-1 text-lg font-semibold text-slate-900 dark:text-white">' . e((string) $block['h3']) . '</h3>';
        return;
    }
    if (!empty($block['ul']) && is_array($block['ul'])) {
        echo '<ul class="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">';
        foreach ($block['ul'] as $li) {
            echo '<li>' . e((string) $li) . '</li>';
        }
        echo '</ul>';
        return;
    }
    if (!empty($block['link']) && is_array($block['link'])) {
        $href = (string) ($block['link']['href'] ?? '#');
        $text = (string) ($block['link']['text'] ?? $href);
        echo '<p class="text-sm"><a href="' . e($href) . '" class="font-medium text-brand-600 hover:underline">' . e($text) . '</a></p>';
    }
}

$groups = [];
foreach ($routes as $item) {
    if (empty($item['category'])) {
        continue;
    }
    $groups[$item['category']][] = $item;
}

$isArticle = !empty($route['published']);
$schema = [
    '@context' => 'https://schema.org',
    '@type' => $isArticle ? 'BlogPosting' : 'WebPage',
    'headline' => $route['h1'],
    'name' => $route['h1'],
    'url' => $canonical,
    'description' => $route['description'],
];
if ($isArticle) {
    $schema['datePublished'] = $route['published'];
    $schema['author'] = ['@type' => 'Person', 'name' => 'Shehan Dinushan'];
    $schema['publisher'] = ['@type' => 'Organization', 'name' => $siteName];
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full scroll-smooth dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($route['title']) ?></title>
<meta name="description" content="<?= e($route['description']) ?>">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="<?= e($canonical) ?>">
<meta property="og:type" content="article">
<meta property="og:site_name" content="<?= e($siteName) ?>">
<meta property="og:title" content="<?= e($route['title']) ?>">
<meta property="og:description" content="<?= e($route['description']) ?>">
<meta property="og:url" content="<?= e($canonical) ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= e($route['title']) ?>">
<meta name="twitter:description" content="<?= e($route['description']) ?>">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<script type="application/ld+json"><?= json_encode($schema, JSON_UNESCAPED_SLASHES) ?></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: { 50:'#eef4ff',100:'#dbe7ff',200:'#b8d0ff',300:'#8bb0ff',400:'#5c8cf5',
                    500:'#3b6fe0',600:'#2c56c9',700:'#2545a3',800:'#1f3a86',900:'#1a2f6b' }
        },
        fontFamily: { sans: ['Inter','ui-sans-serif','system-ui','sans-serif'] }
      }
    }
  };
</script>
<link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body class="h-full bg-slate-50 text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-200">
<div class="relative z-10 flex min-h-full">
<?php include __DIR__ . '/partials/sidebar.php'; ?>
<div class="flex min-w-0 flex-1 flex-col">
<?php include __DIR__ . '/partials/topbar.php'; ?>
<main id="main" class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
<header class="mb-6">
<p class="text-sm font-medium text-brand-600 dark:text-brand-400"><?= e($route['category'] ?? 'Guides') ?></p>
<h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"><?= e($route['h1']) ?></h1>
<p class="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400"><?= e($route['intro']) ?></p>
</header>
<section class="mb-8 space-y-4">
<?php foreach (($route['body'] ?? []) as $block): ?>
<?php render_body_block($block); ?>
<?php endforeach; ?>
</section>
<?php if (!empty($route['faq'])): ?>
<section class="mt-10">
<h2 class="text-xl font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
<dl class="mt-4 space-y-4">
<?php foreach ($route['faq'] as $qa): ?>
<div class="card">
<dt class="font-medium text-slate-900 dark:text-white"><?= e($qa[0]) ?></dt>
<dd class="mt-1 text-sm text-slate-600 dark:text-slate-400"><?= e($qa[1]) ?></dd>
</div>
<?php endforeach; ?>
</dl>
</section>
<?php endif; ?>
</main>
<?php include __DIR__ . '/partials/footer.php'; ?>
</div>
</div>
</body>
</html>
