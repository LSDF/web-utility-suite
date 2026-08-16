<?php
/**
 * sitemap.php - served as /sitemap.xml by the .htaccess rewrite.
 * Generated from config/routes.php so a new tool is indexed automatically.
 */

declare(strict_types=1);
require __DIR__ . '/config/bootstrap.php';

$routes = require __DIR__ . '/config/routes.php';
$siteUrl = rtrim((string) env('SITE_URL', 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')), '/');
$today = gmdate('Y-m-d');

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<?php foreach ($routes as $route): ?>
  <url>
    <loc><?= htmlspecialchars($siteUrl . ($route['slug'] === '' ? '/' : '/' . $route['slug']), ENT_XML1) ?></loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq><?= $route['slug'] === '' ? 'daily' : 'weekly' ?></changefreq>
    <priority><?= $route['slug'] === '' ? '1.0' : '0.8' ?></priority>
  </url>
<?php endforeach; ?>
</urlset>
