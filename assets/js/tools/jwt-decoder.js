/**
 * assets/js/tools/jwt-decoder.js - decode header + payload of a JSON Web Token.
 * The signature is shown but NEVER verified: verification needs your secret,
 * and no website should ever ask you to paste a signing key into a text box.
 */
import { h, area, ghost, row, copy, alertBox } from '../core/dom.js';

const TIME_CLAIMS = { exp: 'Expires', iat: 'Issued at', nbf: 'Not before', auth_time: 'Authenticated at' };

function b64urlDecode(segment) {
  let value = segment.replace(/-/g, '+').replace(/_/g, '/');
  while (value.length % 4 !== 0) value += '=';
  const binary = atob(value);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) arr[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(arr);
}

function fmt(seconds) {
  const d = new Date(seconds * 1000);
  return d.toLocaleString() + ' (' + d.toISOString() + ')';
}

export function mount(root) {
  const input  = area({ rows: 6, placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature' });
  const out    = h('div', { class: 'mt-4 grid gap-4 lg:grid-cols-2' });
  const notes  = h('div', { class: 'mt-4 space-y-2' });

  function box(title, jsonText) {
    const pre = h('pre', { class: 'mono overflow-x-auto whitespace-pre-wrap break-all text-xs', text: jsonText });
    return h('div', { class: 'card' },
      h('div', { class: 'mb-2 flex items-center justify-between' },
        h('h3', { class: 'font-semibold text-slate-900 dark:text-white', text: title }),
        ghost('Copy', { onclick: () => copy(jsonText) })
      ),
      pre
    );
  }

  function run() {
    out.textContent = '';
    notes.textContent = '';
    const token = input.value.trim();
    if (!token) return;

    const parts = token.split('.');
    if (parts.length < 2) {
      notes.appendChild(alertBox('error', 'A JWT has three dot separated segments: header.payload.signature'));
      return;
    }

    let header, payload;
    try {
      header = JSON.parse(b64urlDecode(parts[0]));
      payload = JSON.parse(b64urlDecode(parts[1]));
    } catch (err) {
      notes.appendChild(alertBox('error', 'Could not decode the token: ' + err.message));
      return;
    }

    out.append(
      box('Header', JSON.stringify(header, null, 2)),
      box('Payload', JSON.stringify(payload, null, 2))
    );

    // Human readable timestamps
    const rows = [];
    Object.keys(TIME_CLAIMS).forEach((claim) => {
      if (typeof payload[claim] === 'number') {
        rows.push(h('tr', {},
          h('td', { class: 'mono', text: claim }),
          h('td', { text: TIME_CLAIMS[claim] }),
          h('td', { class: 'text-xs', text: fmt(payload[claim]) })
        ));
      }
    });

    if (rows.length) {
      notes.appendChild(h('div', { class: 'card overflow-x-auto' },
        h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, h('th', { text: 'Claim' }), h('th', { text: 'Meaning' }), h('th', { text: 'Local time' }))),
          h('tbody', {}, rows)
        )
      ));
    }

    if (typeof payload.exp === 'number') {
      const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
      notes.appendChild(secondsLeft <= 0
        ? alertBox('error', 'This token expired ' + Math.abs(Math.round(secondsLeft / 60)) + ' minute(s) ago.')
        : alertBox('success', 'Valid for another ' + Math.round(secondsLeft / 60) + ' minute(s).'));
    }

    notes.appendChild(alertBox('info',
      'Algorithm: ' + (header.alg || 'unknown') +
      '. The signature is not verified here, and you should never paste a signing secret into any website.'));
  }

  input.addEventListener('input', run);

  root.append(
    h('div', {}, h('span', { class: 'label', text: 'JSON Web Token' }), input),
    row(ghost('Clear', { onclick: () => { input.value = ''; run(); } })),
    out,
    notes
  );

  return () => {};
}
