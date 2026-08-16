/**
 * assets/js/tools/qr-generator.js
 * Static QR codes, generated with qrcode.js in the browser (zero server cost).
 * Exports a transparent-capable PNG and a true vector SVG.
 */
import { h, field, btn, ghost, row, select, checkbox, download, toast, alertBox } from '../core/dom.js';

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

const PRESETS = {
  text:  { label: 'Plain text / URL', build: (v) => v.text },
  wifi:  { label: 'WiFi network',     build: (v) => 'WIFI:T:' + v.enc + ';S:' + v.ssid + ';P:' + v.pass + ';;' },
  tel:   { label: 'Phone number',     build: (v) => 'tel:' + v.text },
  sms:   { label: 'SMS',              build: (v) => 'SMSTO:' + v.text + ':' + v.body },
  mail:  { label: 'Email',            build: (v) => 'mailto:' + v.text + '?subject=' + encodeURIComponent(v.body || '') },
  vcard: { label: 'Contact (vCard)',  build: (v) => [
            'BEGIN:VCARD', 'VERSION:3.0', 'FN:' + v.text, 'TEL:' + v.body, 'EMAIL:' + v.extra, 'END:VCARD'
          ].join('\n') }
};

export function mount(root) {
  const canvas = h('canvas', { class: 'mx-auto block max-w-full rounded-lg', width: 320, height: 320 });
  const errors = h('div', {});

  const type    = select({}, Object.keys(PRESETS).map((key) => [key, PRESETS[key].label]));
  const text    = field({ placeholder: 'https://example.com', value: 'https://example.com' });
  const body    = field({ placeholder: 'Secondary value (message, phone, password ...)' });
  const extra   = field({ placeholder: 'Extra value (email for vCard)' });
  const ssid    = field({ placeholder: 'Network name (SSID)' });
  const encSel  = select({}, [['WPA', 'WPA / WPA2'], ['WEP', 'WEP'], ['nopass', 'Open network']]);

  const size    = field({ type: 'number', value: 320, min: 64, max: 2048, step: 8 });
  const margin  = field({ type: 'number', value: 2, min: 0, max: 10 });
  const fg      = h('input', { type: 'color', value: '#0f172a', class: 'h-10 w-full rounded border border-slate-300' });
  const bg      = h('input', { type: 'color', value: '#ffffff', class: 'h-10 w-full rounded border border-slate-300' });
  const ecc     = select({}, [['L', 'L - 7% recovery'], ['M', 'M - 15% (default)'], ['Q', 'Q - 25%'], ['H', 'H - 30% (print / logo)']]);
  ecc.value = 'M';
  const transparent = checkbox('qr-transparent', 'Transparent background (PNG)', false);

  const wifiRow  = h('div', { class: 'grid gap-3 sm:grid-cols-2 hidden' },
    h('div', {}, h('span', { class: 'label', text: 'SSID' }), ssid),
    h('div', {}, h('span', { class: 'label', text: 'Security' }), encSel));
  const bodyWrap = h('div', { class: 'hidden' }, h('span', { class: 'label', text: 'Secondary value' }), body);
  const extraWrap = h('div', { class: 'hidden' }, h('span', { class: 'label', text: 'Email (vCard)' }), extra);

  function payload() {
    return PRESETS[type.value].build({
      text: text.value, body: body.value, extra: extra.value,
      ssid: ssid.value, pass: body.value, enc: encSel.value
    });
  }

  function options() {
    return {
      errorCorrectionLevel: ecc.value,
      margin: Number(margin.value),
      width: Number(size.value),
      color: {
        dark: fg.value,
        light: transparent.input.checked ? '#00000000' : bg.value
      }
    };
  }

  async function draw() {
    errors.textContent = '';
    try {
      const QR = await waitForLib('QRCode');
      const value = payload();
      if (!value || value === 'https://') return;
      await QR.toCanvas(canvas, value, options());
    } catch (err) {
      errors.appendChild(alertBox('error', err.message));
    }
  }

  async function savePng() {
    await draw();
    canvas.toBlob((blob) => {
      if (blob) download('qr-code.png', blob, 'image/png');
      else toast('Could not export PNG', 'error');
    }, 'image/png');
  }

  async function saveSvg() {
    try {
      const QR = await waitForLib('QRCode');
      const svg = await QR.toString(payload(), Object.assign({ type: 'svg' }, options()));
      download('qr-code.svg', svg, 'image/svg+xml');
    } catch (err) {
      errors.appendChild(alertBox('error', err.message));
    }
  }

  function syncFields() {
    const kind = type.value;
    wifiRow.classList.toggle('hidden', kind !== 'wifi');
    bodyWrap.classList.toggle('hidden', ['sms', 'mail', 'vcard', 'wifi'].indexOf(kind) === -1);
    extraWrap.classList.toggle('hidden', kind !== 'vcard');
    draw();
  }

  [text, body, extra, ssid, size, margin, fg, bg].forEach((node) => node.addEventListener('input', draw));
  [encSel, ecc].forEach((node) => node.addEventListener('change', draw));
  transparent.input.addEventListener('change', draw);
  type.addEventListener('change', syncFields);

  root.append(
    h('div', { class: 'grid gap-6 lg:grid-cols-[1fr_320px]' },
      h('div', { class: 'space-y-4' },
        h('div', {}, h('span', { class: 'label', text: 'QR content type' }), type),
        h('div', {}, h('span', { class: 'label', text: 'Value' }), text),
        wifiRow, bodyWrap, extraWrap,
        h('div', { class: 'grid gap-3 sm:grid-cols-2' },
          h('div', {}, h('span', { class: 'label', text: 'Size (px)' }), size),
          h('div', {}, h('span', { class: 'label', text: 'Quiet zone (modules)' }), margin),
          h('div', {}, h('span', { class: 'label', text: 'Foreground' }), fg),
          h('div', {}, h('span', { class: 'label', text: 'Background' }), bg),
          h('div', {}, h('span', { class: 'label', text: 'Error correction' }), ecc)
        ),
        row(transparent),
        row(btn('Download PNG', { onclick: savePng }), ghost('Download SVG', { onclick: saveSvg })),
        errors
      ),
      h('div', { class: 'card flex items-center justify-center bg-white dark:bg-slate-900' }, canvas)
    )
  );

  draw();
  return () => {};
}
