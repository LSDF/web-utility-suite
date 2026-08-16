/**
 * assets/js/tools/url-encoder.js - percent encoding / decoding + query inspector.
 */
import { h, area, btn, ghost, row, select, checkbox, copy, alertBox } from '../core/dom.js';

export function mount(root) {
  const input  = area({ rows: 6, placeholder: 'https://example.com/search?q=hello world&lang=en' });
  const output = area({ rows: 6, readonly: true });
  const errors = h('div', {});
  const table  = h('div', { class: 'mt-4' });

  const mode = select({}, [
    ['component', 'encodeURIComponent - a single parameter value'],
    ['uri', 'encodeURI - a whole address'],
    ['form', 'application/x-www-form-urlencoded - spaces become +']
  ]);

  function encode(value) {
    const kind = mode.value;
    if (kind === 'uri') return encodeURI(value);
    if (kind === 'form') return encodeURIComponent(value).replace(/%20/g, '+');
    return encodeURIComponent(value);
  }

  function decode(value) {
    const prepared = mode.value === 'form' ? value.replace(/\+/g, ' ') : value;
    return decodeURIComponent(prepared);
  }

  function inspect(value) {
    table.textContent = '';
    let url;
    try { url = new URL(value); } catch (e) { return; }
    const params = Array.from(url.searchParams.entries());
    if (!params.length) return;

    const body = h('tbody', {});
    params.forEach((pair) => {
      body.appendChild(h('tr', {},
        h('td', { class: 'mono', text: pair[0] }),
        h('td', { class: 'mono break-all', text: pair[1] })
      ));
    });

    table.append(
      h('h3', { class: 'label', text: 'Query parameters (decoded)' }),
      h('div', { class: 'card overflow-x-auto' },
        h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, h('th', { text: 'Key' }), h('th', { text: 'Value' }))),
          body
        )
      )
    );
  }

  function run(direction) {
    errors.textContent = '';
    try {
      output.value = direction === 'decode' ? decode(input.value) : encode(input.value);
      inspect(direction === 'decode' ? output.value : input.value);
    } catch (err) {
      output.value = '';
      errors.appendChild(alertBox('error', 'Malformed percent encoding: ' + err.message));
    }
  }

  input.addEventListener('input', () => run(/%[0-9a-f]{2}/i.test(input.value) ? 'decode' : 'encode'));

  root.append(
    h('div', { class: 'grid gap-4 lg:grid-cols-2' },
      h('div', {}, h('span', { class: 'label', text: 'Input' }), input),
      h('div', {},
        h('div', { class: 'mb-1 flex items-center justify-between' },
          h('span', { class: 'label mb-0', text: 'Output' }),
          ghost('Copy', { onclick: () => copy(output.value) })
        ),
        output
      )
    ),
    h('div', { class: 'mt-4 space-y-3' },
      h('div', { class: 'max-w-md' }, h('span', { class: 'label', text: 'Encoding mode' }), mode),
      row(btn('Encode', { onclick: () => run('encode') }), ghost('Decode', { onclick: () => run('decode') }),
          ghost('Clear', { onclick: () => { input.value = ''; output.value = ''; table.textContent = ''; } })),
      errors,
      table
    )
  );

  return () => {};
}
