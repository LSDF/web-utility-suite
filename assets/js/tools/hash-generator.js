/**
 * assets/js/tools/hash-generator.js
 * MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 for text or files.
 *
 * SHA digests use the native Web Crypto API. MD5 is not exposed by browsers
 * (deliberately - it is broken), so a compact public-domain style
 * implementation is bundled below for checksum compatibility only.
 */
import { h, area, btn, ghost, row, checkbox, copy, alertBox, bytes } from '../core/dom.js';

/* ------------------------------------------------------------------ MD5 */

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
];

const MD5_K = (function () {
  const table = new Uint32Array(64);
  for (let i = 0; i < 64; i += 1) {
    table[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  }
  return table;
})();

function md5(input) {
  const len = input.length;
  const padded = new Uint8Array(((((len + 8) >> 6) + 1) << 6));
  padded.set(input);
  padded[len] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLen = len * 8;
  view.setUint32(padded.length - 8, bitLen >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bitLen / 4294967296), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let chunk = 0; chunk < padded.length; chunk += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j += 1) M[j] = view.getUint32(chunk + j * 4, true);

    let A = a0, B = b0, C = c0, D = d0;

    for (let i = 0; i < 64; i += 1) {
      let F, g;
      if (i < 16)      { F = (B & C) | (~B & D);       g = i; }
      else if (i < 32) { F = (D & B) | (~D & C);       g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D;                g = (3 * i + 5) % 16; }
      else             { F = C ^ (B | ~D);             g = (7 * i) % 16; }

      F = (F + A + MD5_K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      const shift = MD5_S[i];
      B = (B + (((F << shift) | (F >>> (32 - shift))) >>> 0)) >>> 0;
    }

    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return hex(out);
}

/* ---------------------------------------------------------------- shared */

function hex(buffer) {
  const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < arr.length; i += 1) out += arr[i].toString(16).padStart(2, '0');
  return out;
}

async function sha(algorithm, data) {
  const digest = await crypto.subtle.digest(algorithm, data);
  return hex(digest);
}

const ALGOS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

async function digestAll(data) {
  const results = {};
  results['MD5'] = md5(data);
  const names = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
  for (let i = 0; i < names.length; i += 1) {
    results[names[i]] = await sha(names[i], data);
  }
  return results;
}

/* ------------------------------------------------------------------ view */

export function mount(root) {
  const input   = area({ rows: 6, placeholder: 'Type the text you want to hash...' });
  const results = h('div', { class: 'mt-4 space-y-2' });
  const meta    = h('p', { class: 'hint' });
  const upper   = checkbox('hash-upper', 'Uppercase output', false);

  const fileInput = h('input', { type: 'file', class: 'hidden' });
  const dropzone  = h('div', { class: 'dropzone mt-4 cursor-pointer' },
    h('p', { class: 'text-sm text-slate-600 dark:text-slate-400',
             text: 'Drop a file here, or click to choose one. Files are read locally and never uploaded.' })
  );

  function renderRows(map, source) {
    results.textContent = '';
    ALGOS.forEach((name) => {
      const value = upper.input.checked ? map[name].toUpperCase() : map[name];
      results.appendChild(
        h('div', { class: 'card flex flex-col gap-2 sm:flex-row sm:items-center' },
          h('span', { class: 'w-24 shrink-0 text-sm font-semibold text-slate-900 dark:text-white', text: name }),
          h('code', { class: 'mono min-w-0 flex-1 break-all text-xs', text: value }),
          ghost('Copy', { onclick: () => copy(value) })
        )
      );
    });
    meta.textContent = source;
  }

  let lastData = null;

  async function hashText() {
    const value = input.value;
    if (!value) { results.textContent = ''; meta.textContent = ''; lastData = null; return; }
    lastData = new TextEncoder().encode(value);
    renderRows(await digestAll(lastData), 'Hashed ' + bytes(lastData.length) + ' of UTF-8 text');
  }

  async function hashFile(file) {
    const buffer = await file.arrayBuffer();
    lastData = new Uint8Array(buffer);
    renderRows(await digestAll(lastData), 'Hashed ' + file.name + ' (' + bytes(file.size) + ')');
  }

  input.addEventListener('input', hashText);
  upper.input.addEventListener('change', async () => { if (lastData) renderRows(await digestAll(lastData), meta.textContent); });

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) hashFile(fileInput.files[0]); });

  ['dragenter', 'dragover'].forEach((evt) => dropzone.addEventListener(evt, (e) => {
    e.preventDefault(); dropzone.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach((evt) => dropzone.addEventListener(evt, (e) => {
    e.preventDefault(); dropzone.classList.remove('is-dragging');
  }));
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) hashFile(file);
  });

  root.append(
    h('div', {}, h('span', { class: 'label', text: 'Text input' }), input),
    row(btn('Hash text', { onclick: hashText }), ghost('Clear', {
      onclick: () => { input.value = ''; results.textContent = ''; meta.textContent = ''; }
    }), upper),
    dropzone, fileInput,
    meta,
    results,
    h('div', { class: 'mt-4' }, alertBox('info',
      'MD5 and SHA-1 are fine for checksums but broken for security. Use SHA-256 or better for anything that matters.'))
  );

  return () => {};
}
