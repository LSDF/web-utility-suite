<?php
/**
 * partials/sidebar.php
 * Rendered server side so crawlers see a real internal-linking structure.
 * Every link is a normal <a href> - app.js intercepts the click for pushState,
 * but middle-click, ctrl-click and "open in new tab" all still work.
 *
 * Expects: $groups (category => rows), $route, $siteName
 */
?>
<aside id="sidebar"
       class="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900"
       aria-label="Tool navigation">

  <div class="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
    <a href="/" data-spa class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
      <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">SH</span>
      <span><?= e($siteName) ?></span>
    </a>
    <button type="button" data-sidebar-close
            class="ml-auto rounded p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label="Close navigation">
      <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6.3 6.3a1 1 0 011.4 0L10 8.6l2.3-2.3a1 1 0 111.4 1.4L11.4 10l2.3 2.3a1 1 0 01-1.4 1.4L10 11.4l-2.3 2.3a1 1 0 01-1.4-1.4L8.6 10 6.3 7.7a1 1 0 010-1.4z"/></svg>
    </button>
  </div>

  <div class="px-4 py-3">
    <label for="tool-filter" class="sr-only">Filter tools</label>
    <input id="tool-filter" type="search" placeholder="Filter tools..."
           class="w-full rounded-lg border-slate-300 bg-slate-50 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800">
  </div>

  <nav class="px-3 pb-8">
    <?php foreach ($groups as $category => $items): ?>
      <p class="mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400"><?= e($category) ?></p>
      <ul class="mt-1 space-y-0.5">
        <?php foreach ($items as $item): ?>
          <?php $active = ($item['slug'] === ($route['slug'] ?? '')); ?>
          <li>
            <a href="/<?= e($item['slug']) ?>" data-spa data-nav-slug="<?= e($item['slug']) ?>"
               <?= $active ? 'aria-current="page"' : '' ?>
               class="nav-link <?= $active ? 'nav-link-active' : '' ?>">
              <?= e($item['nav']) ?>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endforeach; ?>
  </nav>
</aside>

<div data-sidebar-backdrop class="fixed inset-0 z-30 hidden bg-slate-900/50 lg:hidden"></div>
