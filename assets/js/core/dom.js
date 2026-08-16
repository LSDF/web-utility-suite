/**
 * assets/js/core/dom.js
 * Tiny DOM + UX helpers shared by every tool module.
 * No dependencies, no build step, works as a native ES module.
 */

export const qs  = (sel, root) => (root || document).querySelector(sel);
export const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/**
 * h('div', {class:'card', onclick: fn}, child, child)
 * Attributes: class, id, type, value, html (innerHTML), text, dataset object,
 * on* handlers, everything else becomes setAttribute.
 */
export function h(tag, attrs, ...children) {
  const node = document.createElement(tag);
  const a = attrs || {};

  Object.keys(a).forEach((key) => {
    const value = a[key];
    if (value === null || value === undefined || value === false) return;

    if (key === 'class' || key === 'className') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.slice(0, 2) === 'on' && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'value') node.value = value;
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  });

  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  });

  return node;
}

/** Convenience builders used all over the tool modules. */
export const field = (attrs) => h('input', Object.assign({ class: 'field', type: 'text' }, attrs));
export const area  = (attrs) => h('textarea', Object.assign({ class: 'field mono', spellcheck: 'false' }, attrs));
export const label = (forId, textValue) => h('label', { class: 'label', for: forId, text: textValue });
export const btn   = (textValue, attrs) => h('button', Object.assign({ class: 'btn btn-primary', type: 'button', text: textValue }, attrs || {}));
export const ghost = (textValue, attrs) => h('button', Object.assign({ class: 'btn btn-ghost', type: 'button', text: textValue }, attrs || {}));
export const row   = (...children) => h('div', { class: 'flex flex-wrap items-center gap-2' }, children);
export const grid  = (...children) => h('div', { class: 'grid gap-4 sm:grid-cols-2' }, children);

export function select(attrs, options) {
  const node = h('select', Object.assign({ class: 'field' }, attrs));
  (options || []).forEach((opt) => {
    const value = Array.isArray(opt) ? opt[0] : opt;
    const text  = Array.isArray(opt) ? opt[1] : opt;
    node.appendChild(h('option', { value: value, text: text }));
  });
  return node;
}

export function checkbox(id, textValue, checked) {
  const input = h('input', { type: 'checkbox', id: id, class: 'rounded border-slate-300 text-brand-600 focus:ring-brand-500' });
  input.checked = !!checked;
  const wrap = h('label', { class: 'flex items-center gap-2 text-sm', for: id }, input, h('span', { text: textValue }));
  wrap.input = input;
  return wrap;
}

/* ------------------------------------------------------------------ misc */

export function debounce(fn, ms) {
  let timer = null;
  return function () {
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(null, args), ms || 200);
  };
}

export function bytes(n) {
  if (!n && n !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let value = n;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1; }
  return (i === 0 ? value : value.toFixed(1)) + ' ' + units[i];
}

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard');
    return true;
  } catch (err) {
    const ta = h('textarea', { value: text, style: { position: 'fixed', opacity: '0' } });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('Copied to clipboard');
    return true;
  }
}

export function download(filename, data, mime) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
  const url  = URL.createObjectURL(blob);
  const a    = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

let toastTimer = null;
export function toast(message, type) {
  let box = qs('#wus-toast');
  if (!box) {
    box = h('div', {
      id: 'wus-toast',
      class: 'pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium text-white opacity-0 transition-opacity duration-200'
    });
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.style.background = type === 'error' ? '#dc2626' : '#0f172a';
  box.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.style.opacity = '0'; }, 2200);
}

/** Standard error / success blocks inside a tool panel. */
export function alertBox(type, message) {
  return h('div', { class: 'alert alert-' + type, text: message });
}

/** A labelled output box with a copy button. */
export function outputBox(labelText, opts) {
  const options = opts || {};
  const out = area({ readonly: true, rows: options.rows || 6 });
  const head = h('div', { class: 'mb-1 flex items-center justify-between' },
    h('span', { class: 'label mb-0', text: labelText }),
    ghost('Copy', { onclick: () => copy(out.value) })
  );
  const wrap = h('div', {}, head, out);
  wrap.output = out;
  return wrap;
}

/** Section wrapper with a heading, used to keep tool panels consistent. */
export function panel(titleText, ...children) {
  return h('section', { class: 'space-y-3' },
    titleText ? h('h2', { class: 'text-lg font-semibold text-slate-900 dark:text-white', text: titleText }) : null,
    children
  );
}
