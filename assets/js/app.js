/**
 * assets/js/app.js
 * ---------------------------------------------------------------------------
 * SPA router for the Web Utility Suite.
 *
 * SEO contract
 *   1. index.php renders the correct <title>, description, canonical, OG tags,
 *      H1, intro copy and FAQ for the requested URL. A crawler that never runs
 *      JavaScript still gets a complete, unique document per tool.
 *   2. This router intercepts internal clicks, calls history.pushState() so the
 *      address bar shows /qr-generator, /pdf-to-word ... with no reload, and
 *      then rewrites the very same tags client side so social scrapers that DO
 *      execute JS, and users who share the URL, stay consistent.
 *   3. Every navigation target is a real <a href>, so ctrl-click, middle click
 *      and "copy link address" behave exactly like a classic multi page site.
 */

import { qs, qsa, h, alertBox } from './core/dom.js';

const TOOLS = {
  'pdf-to-word':        () => import('./tools/pdf-to-word.js'),
  'word-to-pdf':        () => import('./tools/word-to-pdf.js'),
  'temp-mail':          () => import('./tools/temp-mail.js'),
  'base64':             () => import('./tools/base64.js'),
  'hash-generator':     () => import('./tools/hash-generator.js'),
  'ip-dns-lookup':      () => import('./tools/ip-dns-lookup.js'),
  'json-formatter':     () => import('./tools/json-formatter.js'),
  'url-encoder':        () => import('./tools/url-encoder.js'),
  'jwt-decoder':        () => import('./tools/jwt-decoder.js'),
  'qr-generator':       () => import('./tools/qr-generator.js'),
  'barcode-generator':  () => import('./tools/barcode-generator.js'),
  'word-counter':       () => import('./tools/word-counter.js'),
  'password-generator': () => import('./tools/password-generator.js'),
  'text-summarizer':    () => import('./tools/text-summarizer.js'),
  'code-explainer':     () => import('./tools/code-explainer.js')
};

const ROUTES = window.__ROUTES__ || {};
const SITE   = window.__SITE__ || { name: 'Web Utility Suite', url: location.origin };

let currentSlug = window.__SLUG__ === undefined ? '' : window.__SLUG__;
let disposer    = null;

function setMeta(selector, attr, value) {
  const node = qs(selector);
  if (node) node.setAttribute(attr, value);
}

function updateSeo(route) {
  const url = SITE.url + (route.slug === '' ? '/' : '/' + route.slug);
  document.title = route.title;
  setMeta('meta[name="description"]', 'content', route.description);
  setMeta('link[rel="canonical"]', 'href', url);
  setMeta('meta[property="og:title"]', 'content', route.title);
  setMeta('meta[property="og:description"]', 'content', route.description);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('meta[property="og:image"]', 'content', SITE.url + '/assets/img/og/' + (route.slug === '' ? 'home' : route.slug) + '.png');
  setMeta('meta[name="twitter:title"]', 'content', route.title);
  setMeta('meta[name="twitter:description"]', 'content', route.description);
  const robots = qs('meta[name="robots"]');
  if (robots) robots.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1');
  const cat   = qs('[data-seo="category"]');
  const head1 = qs('[data-seo="h1"]');
  const intro = qs('[data-seo="intro"]');
  if (cat)   cat.textContent   = route.category || 'All tools';
  if (head1) head1.textContent = route.h1;
  if (intro) intro.textContent = route.intro;
  renderBody(route);
  renderFaq(route);
  updateJsonLd(route, url);
}

function renderBody(route) {
  const section = qs('[data-seo="body"]');
  if (!section) return;
  const body = route.body || [];
  section.classList.toggle('hidden', body.length === 0);
  section.textContent = '';
  body.forEach((block) => {
    if (typeof block === 'string') {
      section.appendChild(h('p', { class: 'text-sm leading-relaxed text-slate-600 dark:text-slate-400', text: block }));
      return;
    }
    if (!block || typeof block !== 'object') return;
    if (block.h2) {
      section.appendChild(h('h2', { class: 'pt-2 text-xl font-semibold text-slate-900 dark:text-white', text: block.h2 }));
      return;
    }
    if (block.h3) {
      section.appendChild(h('h3', { class: 'pt-1 text-lg font-semibold text-slate-900 dark:text-white', text: block.h3 }));
      return;
    }
    if (Array.isArray(block.ul)) {
      const ul = h('ul', { class: 'list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400' });
      block.ul.forEach((item) => ul.appendChild(h('li', { text: item })));
      section.appendChild(ul);
      return;
    }
    if (block.link && block.link.href) {
      const p = h('p', { class: 'text-sm' });
      p.appendChild(h('a', { href: block.link.href, class: 'font-medium text-brand-600 hover:underline', 'data-spa': '', text: block.link.text || block.link.href }));
      section.appendChild(p);
    }
  });
  if (route.slug === 'contact') {
    const p = h('p', { class: 'text-sm' });
    p.appendChild(h('a', { href: 'mailto:shehandinushan7@gmail.com', class: 'font-medium text-brand-600 hover:underline', text: 'shehandinushan7@gmail.com' }));
    section.appendChild(p);
  }
}

function renderFaq(route) {
  const section = qs('[data-seo="faq"]');
  if (!section) return;
  const faq = route.faq || [];
  section.classList.toggle('hidden', faq.length === 0);
  const list = qs('dl', section);
  if (!list) return;
  list.textContent = '';
  faq.forEach((qa) => {
    list.appendChild(h('div', { class: 'card' }, h('dt', { class: 'font-medium text-slate-900 dark:text-white', text: qa[0] }), h('dd', { class: 'mt-1 text-sm text-slate-600 dark:text-slate-400', text: qa[1] })));
  });
}

function updateJsonLd(route, url) {
  qsa('script[type="application/ld+json"][data-dynamic]').forEach((n) => n.remove());
  const app = {
    '@context': 'https://schema.org',
    '@type': route.slug === '' ? 'WebSite' : 'SoftwareApplication',
    name: route.slug === '' ? SITE.name : route.h1,
    url: url,
    description: route.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };
  const blocks = [app];
  if ((route.faq || []).length) {
    blocks.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: route.faq.map((qa) => ({ '@type': 'Question', name: qa[0], acceptedAnswer: { '@type': 'Answer', text: qa[1] } })) });
  }
  blocks.forEach((block) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-dynamic', '');
    script.textContent = JSON.stringify(block);
    document.head.appendChild(script);
  });
}

function setActiveNav(slug) {
  qsa('[data-nav-slug]').forEach((link) => {
    const active = link.dataset.navSlug === slug;
    link.classList.toggle('nav-link-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

async function mountTool(slug) {
  const root = qs('#tool-root');
  if (!root) return;
  const route = ROUTES[slug] || {};
  const isPage = route.type === 'page';
  root.classList.toggle('hidden', isPage);
  if (isPage) {
    if (typeof disposer === 'function') { try { disposer(); } catch (e) {} disposer = null; }
    root.textContent = '';
    return;
  }
  if (typeof disposer === 'function') { try { disposer(); } catch (e) {} disposer = null; }
  root.textContent = '';
  root.dataset.slug = slug;
  const loader = TOOLS[slug];
  if (!loader) {
    root.appendChild(h('p', { class: 'text-sm text-slate-600 dark:text-slate-400', text: 'Pick a tool from the sidebar to get started.' }));
    return;
  }
  root.classList.add('is-loading');
  root.appendChild(h('p', { class: 'flex items-center gap-2 text-sm text-slate-500' }, h('span', { class: 'spinner' }), 'Loading tool...'));
  try {
    const mod = await loader();
    root.textContent = '';
    disposer = mod.mount(root) || null;
  } catch (err) {
    root.textContent = '';
    root.appendChild(alertBox('error', 'This tool failed to load: ' + err.message));
  } finally {
    root.classList.remove('is-loading');
  }
}

async function render(slug, opts) {
  const options = opts || {};
  const route = ROUTES[slug] || ROUTES[''];
  currentSlug = route.slug;
  updateSeo(route);
  setActiveNav(route.slug);
  await mountTool(route.slug);
  if (options.scroll !== false) {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
  const heading = qs('[data-seo="h1"]');
  if (heading && options.focus !== false) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
  document.dispatchEvent(new CustomEvent('wus:navigated', { detail: { slug: route.slug } }));
}

function slugFromPath(pathname) {
  return pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
}

export function navigate(href, opts) {
  const url  = new URL(href, location.origin);
  const slug = slugFromPath(url.pathname);
  if (!(slug in ROUTES)) { window.location.href = href; return; }
  if (slug === currentSlug && !(opts && opts.force)) return;
  history.pushState({ slug: slug }, '', url.pathname + url.search);
  render(slug);
}

function isInternalLink(anchor) {
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  if (anchor.origin !== location.origin) return false;
  const rel = anchor.getAttribute('rel') || '';
  return rel.indexOf('external') === -1;
}

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = event.target.closest ? event.target.closest('a') : null;
  if (!isInternalLink(anchor)) return;
  const slug = slugFromPath(new URL(anchor.href).pathname);
  if (!(slug in ROUTES)) return;
  event.preventDefault();
  navigate(anchor.href);
  closeSidebar();
});

window.addEventListener('popstate', (event) => {
  const slug = (event.state && event.state.slug !== undefined) ? event.state.slug : slugFromPath(location.pathname);
  render(slug in ROUTES ? slug : '', { focus: false });
});

function openSidebar() {
  const bar = qs('#sidebar');
  const backdrop = qs('[data-sidebar-backdrop]');
  if (bar) bar.classList.remove('-translate-x-full');
  if (backdrop) backdrop.classList.remove('hidden');
  const toggle = qs('[data-sidebar-open]');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  const bar = qs('#sidebar');
  const backdrop = qs('[data-sidebar-backdrop]');
  if (bar && window.innerWidth < 1024) bar.classList.add('-translate-x-full');
  if (backdrop) backdrop.classList.add('hidden');
  const toggle = qs('[data-sidebar-open]');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function initChrome() {
  const openBtn  = qs('[data-sidebar-open]');
  const closeBtn = qs('[data-sidebar-close]');
  const backdrop = qs('[data-sidebar-backdrop]');
  if (openBtn)  openBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSidebar();
    if (event.key === '/' && document.activeElement === document.body) {
      const filter = qs('#tool-filter');
      if (filter) { event.preventDefault(); filter.focus(); }
    }
  });
  const filter = qs('#tool-filter');
  if (filter) {
    filter.addEventListener('input', () => {
      const term = filter.value.trim().toLowerCase();
      qsa('#sidebar nav li').forEach((li) => {
        const match = li.textContent.toLowerCase().indexOf(term) !== -1;
        li.classList.toggle('hidden', term !== '' && !match);
      });
      qsa('#sidebar nav p').forEach((heading) => {
        const list = heading.nextElementSibling;
        if (!list) return;
        const anyVisible = Array.from(list.children).some((li) => !li.classList.contains('hidden'));
        heading.classList.toggle('hidden', !anyVisible);
      });
    });
  }
  const stored = localStorage.getItem('wus-theme');
  document.documentElement.classList.toggle('dark', stored !== 'light');
  const themeBtn = qs('[data-theme-toggle]');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('wus-theme', isDark ? 'dark' : 'light');
    });
  }
}

function boot() {
  initChrome();
  history.replaceState({ slug: currentSlug }, '', location.pathname + location.search);
  render(currentSlug, { scroll: false, focus: false });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

window.WUS = { navigate: navigate, routes: ROUTES };
