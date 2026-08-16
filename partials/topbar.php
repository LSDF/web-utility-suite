<?php
/**
 * partials/topbar.php - mobile menu button, breadcrumb and theme toggle.
 * Expects: $route
 */
?>
<header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/90">

  <button type="button" data-sidebar-open
          class="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">
    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/></svg>
  </button>

  <nav aria-label="Breadcrumb" class="min-w-0 flex-1 truncate text-sm text-slate-500 dark:text-slate-400">
    <a href="/" data-spa class="hover:text-brand-600">Home</a>
    <?php if (!empty($route['category'])): ?>
      <span class="mx-1.5">/</span><span data-seo="crumb-category"><?= e($route['category']) ?></span>
      <span class="mx-1.5">/</span><span data-seo="crumb-tool" class="text-slate-700 dark:text-slate-200"><?= e($route['nav']) ?></span>
    <?php endif; ?>
  </nav>

  <button type="button" data-theme-toggle
          class="rounded p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle dark mode">
    <svg class="h-5 w-5 dark:hidden" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>
    <svg class="hidden h-5 w-5 dark:block" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4a1 1 0 011 1v1a1 1 0 11-2 0V5a1 1 0 011-1zm0 12a4 4 0 100-8 4 4 0 000 8zm7-4a1 1 0 011 1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-14 0a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm11.7 5.3a1 1 0 011.4 0l.7.7a1 1 0 01-1.4 1.4l-.7-.7a1 1 0 010-1.4zM5.2 5.2a1 1 0 011.4 0l.7.7A1 1 0 015.9 7.3l-.7-.7a1 1 0 010-1.4zM12 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6.8-12.8a1 1 0 010 1.4l-.7.7a1 1 0 01-1.4-1.4l.7-.7a1 1 0 011.4 0zM6.6 17.3a1 1 0 010 1.4l-.7.7a1 1 0 01-1.4-1.4l.7-.7a1 1 0 011.4 0z"/></svg>
  </button>
</header>
