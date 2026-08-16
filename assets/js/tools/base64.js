/**
 * assets/js/tools/base64.js - Base64 encoder / decoder (100% client side).
 */
import { h, area, btn, ghost, row, checkbox, copy, download, toast, alertBox, bytes } from '../core/dom.js';

function toBase64(text, urlSafe) {
  const bytesArr = new TextEncoder().encode(text);
  let binary = '';
  bytesArr.forEach((b) => { binary += String.fromCharCode(b); });
  let out = btoa(binary);
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return out;
}

function fromBase64(value) {
  let clean = value.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (clean.length % 4 !== 0) clean += '=';
  const binary = atob(clean);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) arr[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: false }).decode(arr);
}

export function mount(root) {
  const input  = area({ rows: 8, placeholder: 'Type or paste text here...' });
  const output = area({ rows: 8, readonly: true, placeholder: 'Result appears here' });
  const status = h('div', { class: 'text-xs text-slate-500' });
  const errors = h('div', {});

  const urlSafe = checkbox('b64-urlsafe', 'URL safe alphabet (- and _ , no padding)', false);
  const live    = checkbox('b64-live', 'Live conversion', true);

  function run(mode) {
    errors.textContent = '';
    const value = input.value;
    if (!value) { output.value = ''; status.textContent = ''; return; }
    try {
      output.value = mode === 'decode' ? fromBase64(value) : toBase64(value, urlSafe.input.checked);
      status.textContent = 'Input ' + bytes(new Blob([value]).size) +
                           '  ->  output ' + bytes(new Blob([output.value]).size);
    } catch (err) {
      output.value = '';
      errors.appendChild(alertBox('error', 'That is not valid Base64. Check for stray characters or a truncated string.'));
    }
  }

  const encodeBtn = btn('Encode', { onclick: () => run('encode') });
  const decodeBtn = ghost('Decode', { onclick: () => run('decode') });

  input.addEventListener('input', () => {
    if (!live.input.checked) return;
    // Guess the direction: a valid Base64 blob has no spaces and a legal alphabet.
    const value = input.value.trim();
    const looksEncoded = value.length > 3 && /^[A-Za-z0-9+/\-_=\s]+$/.test(value) && !/\s/.test(value);
    run(looksEncoded ? 'decode' : 'encode');
  });

  root.append(
    h('div', { class: 'grid gap-4 lg:grid-cols-2' },
      h('div', {},
        h('div', { class: 'mb-1 flex items-center justify-between' },
          h('span', { class: 'label mb-0', text: 'Input' }),
          ghost('Clear', { onclick: () => { input.value = ''; output.value = ''; status.textContent = ''; errors.textContent = ''; } })
        ),
        input
      ),
      h('div', {},
        h('div', { class: 'mb-1 flex items-center justify-between' },
          h('span', { class: 'label mb-0', text: 'Output' }),
          h('div', { class: 'flex gap-2' },
            ghost('Copy', { onclick: () => copy(output.value) }),
            ghost('Download', { onclick: () => download('base64.txt', output.value, 'text/plain') })
          )
        ),
        output
      )
    ),
    h('div', { class: 'mt-4 space-y-3' },
      row(encodeBtn, decodeBtn, ghost('Swap', {
        onclick: () => { const tmp = input.value; input.value = output.value; output.value = tmp; }
      })),
      row(urlSafe, live),
      status,
      errors
    )
  );

  return () => {};
}
