<?php
/**
 * index.php - SEO shell for the Web Utility Suite SPA
 * ---------------------------------------------------------------------------
 * .htaccess routes every non-file request here. We resolve the requested slug
 * server side and emit the correct <title>, meta description, canonical URL,
 * Open Graph / Twitter tags and JSON-LD BEFORE a single byte of JavaScript
 * runs, so Googlebot, Bingbot, Slack, WhatsApp and X all read real metadata.
 *
 * The browser then boots assets/js/app.js which takes over navigation with
 * history.pushState() - no reloads, but every tool keeps its own indexable URL.
 */

declare(strict_types=1);

require __DIR__ . '/config/bootstrap.php';

$routes = require __DIR__ . '/config/routes.php';

/* ---------------------------------------------------------------- routing */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$slug = trim((string) $path, '/');
$slug = strtolower(preg_replace('/[^a-z0-9\-]/i', '', $slug));

$isHome  = ($slug === '');
$is404   = false;
$routeKey = $isHome ? 'home' : $slug;

if (!isset($routes[$routeKey])) {
    $is404    = true;
    $routeKey = 'home';
    http_response_code(404);
}

$route = $routes[$routeKey];

/* ------------------------------------------------------------ SEO values */

$siteName = 'Web Utility Suite';
$siteUrl  = rtrim((string) env('SITE_URL', 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')), '/');
$canonical = $siteUrl . ($route['slug'] === '' ? '/' : '/' . $route['slug']);

$title = $is404
    ? 'Page not found (404) | ' . $siteName
    : $route['title'];

$description = $is404
    ? 'That tool does not exist. Browse the full catalogue of free developer, security and business utilities instead.'
    : $route['description'];

$ogImage = $siteUrl . '/assets/img/og/' . ($route['slug'] === '' ? 'home' : $route['slug']) . '.png';

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/* --------------------------------------------------------- sidebar groups */

$groups = [];
foreach ($routes as $key => $item) {
    if (empty($item['category'])) {
        continue;
    }
    $groups[$item['category']][] = $item;
}

/* ------------------------------------------------------------- structured */

$breadcrumb = [
    '@context' => 'https://schema.org',
    '@type'    => 'BreadcrumbList',
    'itemListElement' => [
        ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => $siteUrl . '/'],
    ],
];
if (!$isHome && !$is404) {
    $breadcrumb['itemListElement'][] = [
        '@type'    => 'ListItem',
        'position' => 2,
        'name'     => $route['category'],
        'item'     => $siteUrl . '/#' . strtolower(str_replace(' ', '-', (string) $route['category'])),
    ];
    $breadcrumb['itemListElement'][] = [
        '@type'    => 'ListItem',
        'position' => 3,
        'name'     => $route['nav'],
        'item'     => $canonical,
    ];
}

$appSchema = [
    '@context'        => 'https://schema.org',
    '@type'           => $isHome ? 'WebSite' : 'SoftwareApplication',
    'name'            => $isHome ? $siteName : $route['h1'],
    'url'             => $canonical,
    'description'     => $description,
    'applicationCategory' => 'UtilitiesApplication',
    'operatingSystem' => 'Any (web browser)',
    'offers'          => ['@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'USD'],
];

$faqSchema = null;
if (!empty($route['faq'])) {
    $faqSchema = ['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => []];
    foreach ($route['faq'] as $qa) {
        $faqSchema['mainEntity'][] = [
            '@type'          => 'Question',
            'name'           => $qa[0],
            'acceptedAnswer' => ['@type' => 'Answer', 'text' => $qa[1]],
        ];
    }
}

/* ---------------------------------------------- metadata handed to the SPA */

$clientRoutes = [];
foreach ($routes as $key => $item) {
    $clientRoutes[$item['slug']] = [
        'slug'        => $item['slug'],
        'nav'         => $item['nav'],
        'category'    => $item['category'],
        'title'       => $item['title'],
        'h1'          => $item['h1'],
        'description' => $item['description'],
        'intro'       => $item['intro'],
        'faq'         => $item['faq'],
    ];
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full scroll-smooth dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#04070a">

<title><?= e($title) ?></title>
<meta name="description" content="<?= e($description) ?>">
<?php if (!empty($route['keywords'])): ?>
<meta name="keywords" content="<?= e($route['keywords']) ?>">
<?php endif; ?>
<meta name="robots" content="<?= $is404 ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1' ?>">
<link rel="canonical" href="<?= e($canonical) ?>">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= e($siteName) ?>">
<meta property="og:title" content="<?= e($title) ?>">
<meta property="og:description" content="<?= e($description) ?>">
<meta property="og:url" content="<?= e($canonical) ?>">
<meta property="og:image" content="<?= e($ogImage) ?>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= e($title) ?>">
<meta name="twitter:description" content="<?= e($description) ?>">
<meta name="twitter:image" content="<?= e($ogImage) ?>">

<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/xml" href="/sitemap.xml">

<script type="application/ld+json"><?= json_encode($appSchema, JSON_UNESCAPED_SLASHES) ?></script>
<script type="application/ld+json"><?= json_encode($breadcrumb, JSON_UNESCAPED_SLASHES) ?></script>
<?php if ($faqSchema): ?>
<script type="application/ld+json"><?= json_encode($faqSchema, JSON_UNESCAPED_SLASHES) ?></script>
<?php endif; ?>

<!-- Tailwind. Swap for the compiled file in production, see DEPLOYMENT.md -->
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<script>
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { 50:'#04120c',100:'#061c13',200:'#0a2f1f',300:'#0e6b3f',400:'#4dffa1',
                     500:'#22ff88',600:'#12e878',700:'#0bbf61',800:'#0a8f4a',900:'#075f32' }
      },
      fontFamily: {
            sans: ['ui-monospace','JetBrains Mono','Fira Code','SFMono-Regular','Menlo','Consolas','monospace'],
            mono: ['ui-monospace','JetBrains Mono','Fira Code','SFMono-Regular','Menlo','Consolas','monospace']
          }
    }
  }
};
</script>
<link rel="stylesheet" href="/assets/css/styles.css">
</head>

<body class="h-full bg-slate-50 text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-200">

<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white">Skip to content</a>

<!-- The name, behind every page. Decorative only: aria-hidden, no pointer events. -->
<div class="wordmark" aria-hidden="true"><span>SHADOW</span><span>CHEETAH</span></div>

<div class="relative z-10 flex min-h-full">

  <?php include __DIR__ . '/partials/sidebar.php'; ?>

  <div class="flex min-w-0 flex-1 flex-col">

    <?php include __DIR__ . '/partials/topbar.php'; ?>

    <main id="main" class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      <!-- Server rendered, crawlable content. app.js updates it on pushState. -->
      <header class="mb-6">
        <p data-seo="category" class="text-sm font-medium text-brand-600 dark:text-brand-400"><?= e($route['category'] ?? 'All tools') ?></p>
        <h1 data-seo="h1" class="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"><?= e($is404 ? 'Page not found' : $route['h1']) ?></h1>
        <p data-seo="intro" class="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400"><?= e($is404 ? 'The URL you followed does not match any tool in this suite. Pick one from the sidebar to continue.' : $route['intro']) ?></p>
      </header>

      <!-- The interactive tool is mounted here by the matching JS module -->
      <section id="tool-root" data-slug="<?= e($route['slug']) ?>" class="card">
        <noscript>
          <p class="text-sm text-amber-700 dark:text-amber-400">
            This tool needs JavaScript. The description above is served without it so the page stays indexable.
          </p>
        </noscript>
      </section>

      <?php if ($isHome && !$is404): ?>
      <section class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <?php foreach ($groups as $category => $items): ?>
          <?php foreach ($items as $item): ?>
          <a href="/<?= e($item['slug']) ?>" data-spa class="card block transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg">
            <p class="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400"><?= e($category) ?></p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900 dark:text-white"><?= e($item['nav']) ?></h2>
            <p class="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400"><?= e($item['description']) ?></p>
          </a>
          <?php endforeach; ?>
        <?php endforeach; ?>
      </section>
      <?php endif; ?>

      <!-- FAQ: rendered server side for the FAQPage rich result -->
      <section data-seo="faq" class="mt-10 <?= empty($route['faq']) ? 'hidden' : '' ?>">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
        <dl class="mt-4 space-y-4">
          <?php foreach (($route['faq'] ?? []) as $qa): ?>
          <div class="card">
            <dt class="font-medium text-slate-900 dark:text-white"><?= e($qa[0]) ?></dt>
            <dd class="mt-1 text-sm text-slate-600 dark:text-slate-400"><?= e($qa[1]) ?></dd>
          </div>
          <?php endforeach; ?>
        </dl>
      </section>

    </main>

    <?php include __DIR__ . '/partials/footer.php'; ?>
  </div>
</div>

<script>
  window.__SITE__   = <?= json_encode(['name' => $siteName, 'url' => $siteUrl], JSON_UNESCAPED_SLASHES) ?>;
  window.__ROUTES__ = <?= json_encode($clientRoutes, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
  window.__SLUG__   = <?= json_encode($route['slug']) ?>;
</script>

<!-- Third party generators, loaded once, zero server cost -->
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js" defer></script>
<script type="module" src="/assets/js/app.js"></script>
</body>
</html>
