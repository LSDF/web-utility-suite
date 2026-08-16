/**
 * assets/js/tools/barcode-generator.js - JsBarcode wrapper, PNG + SVG export.
 */
import { h, field, btn, ghost, row, select, checkbox, download, alertBox } from '../core/dom.js';

function waitForLib(name, timeout) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    (function check() {
      if (window[name]) return resolve(window[name]);
      if (Date.now() - started > (timeout || 8000)) return reject(new Error(name + ' failed to load'));
      setTimeout(check, 60);
    })();
  });
}

const FORMATS = [
  ['CODE128', 'CODE128 (auto, any ASCII)'],
  ['CODE128A', 'CODE128 A'],
  ['CODE128B', 'CODE128 B'],
  ['CODE128C', 'CODE128 C (digits, even count)'],
  ['CODE39', 'CODE39'],
  ['EAN13', 'EAN-13 (12 or 13 digits)'],
  ['EAN8', 'EAN-8 (7 or 8 digits)'],
  ['EAN5', 'EAN-5 add-on'],
  ['UPC', 'UPC-A (11 or 12 digits)'],
  ['ITF14', 'ITF-14 (13 or 14 digits)'],
  ['ITF', 'ITF (even digits)'],
  ['MSI', 'MSI'],
  ['pharmacode', 'Pharmacode (3 - 131070)']
];

const SAMPLES = {
  CODE128: 'WUS-2026-0001', CODE39: 'HELLO-39', EAN13: '5901234123457',
  EAN8: '96385074', UPC: '036000291452', ITF14: '15400141288763',
  MSI: '1234567', pharmacode: '1234'
};

export function mount(root) {
  const svg    = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'mx-auto block max-w-full');
  const errors = h('div', {});

  const value   = field({ value: SAMPLES.CODE128, placeholder: 'Value to encode' });
  const format  = select({}, FORMATS);
  const width   = field({ type: 'number', value: 2, min: 1, max: 6, step: 0.5 });
  const height  = field({ type: 'number', value: 90, min: 20, max: 300, step: 5 });
  const fontSize = field({ type: 'number', value: 18, min: 8, max: 40 });
  const lineColor = h('input', { type: 'color', value: '#0f172a', class: 'h-10 w-full rounded border border-slate-300' });
  const showText = checkbox('bc-text', 'Show human readable text', true);

  async function draw() {
    errors.textContent = '';
    try {
      const JsBarcode = await waitForLib('JsBarcode');
      JsBarcode(svg, value.value, {
        format: format.value,
        width: Number(width.value),
        height: Number(height.value),
        displayValue: showText.input.checked,
        fontSize: Number(fontSize.value),
        lineColor: lineColor.value,
        background: '#ffffff',
        margin: 10,
        valid: (isValid) => {
          if (!isValid) {
            errors.appendChild(alertBox('error',
              'The value does not satisfy the rules of ' + format.value +
              '. Check the digit count and the check digit.'));
          }
        }
      });
    } catch (err) {
      errors.appendChild(alertBox('error', err.message));
    }
  }

  function svgMarkup() {
    return new XMLSerializer().serializeToString(svg);
  }

  function saveSvg() {
    download('barcode.svg', svgMarkup(), 'image/svg+xml');
  }

  function savePng() {
    const markup = svgMarkup();
    const image = new Image();
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 3;
      canvas.width  = image.width * scale;
      canvas.height = image.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => { if (blob) download('barcode.png', blob, 'image/png'); }, 'image/png');
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  format.addEventListener('change', () => {
    if (SAMPLES[format.value]) value.value = SAMPLES[format.value];
    draw();
  });
  [value, width, height, fontSize, lineColor].forEach((node) => node.addEventListener('input', draw));
  showText.input.addEventListener('change', draw);

  root.append(
    h('div', { class: 'grid gap-6 lg:grid-cols-[1fr_360px]' },
      h('div', { class: 'space-y-4' },
        h('div', {}, h('span', { class: 'label', text: 'Symbology' }), format),
        h('div', {}, h('span', { class: 'label', text: 'Value' }), value),
        h('div', { class: 'grid gap-3 sm:grid-cols-2' },
          h('div', {}, h('span', { class: 'label', text: 'Bar width' }), width),
          h('div', {}, h('span', { class: 'label', text: 'Height (px)' }), height),
          h('div', {}, h('span', { class: 'label', text: 'Font size' }), fontSize),
          h('div', {}, h('span', { class: 'label', text: 'Bar colour' }), lineColor)
        ),
        row(showText),
        row(btn('Download PNG', { onclick: savePng }), ghost('Download SVG', { onclick: saveSvg })),
        errors
      ),
      h('div', { class: 'card flex items-center justify-center bg-white' }, svg)
    )
  );

  draw();
  return () => {};
}
