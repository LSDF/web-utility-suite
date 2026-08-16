<?php
/**
 * partials/footer.php - static internal links help crawl depth stay at 1.
 * Expects: $groups, $siteName
 */
?>
<footer class="mt-12 border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900">
  <div class="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
    <?php foreach ($groups as $category => $items): ?>
      <div>
        <p class="text-sm font-semibold text-slate-900 dark:text-white"><?= e($category) ?></p>
        <ul class="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <?php foreach ($items as $item): ?>
            <li><a href="/<?= e($item['slug']) ?>" data-spa class="hover:text-brand-600"><?= e($item['nav']) ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endforeach; ?>
  </div>
  <p class="mx-auto mt-8 max-w-5xl text-xs text-slate-500 dark:text-slate-500">
    &copy; <?= date('Y') ?> <?= e($siteName) ?>. Client side tools never upload your data. Server side tools proxy through PHP so no API key is ever exposed to the browser.
  </p>
</footer>
