/**
 * assets/js/tools/ip-dns-lookup.js
 * Calls /api/dns.php - the resolver runs server side so results reflect a
 * public resolver rather than your ISP cache, and no third party key is used.
 */
import { h, field, btn, ghost, row, checkbox, alertBox, copy } from '../core/dom.js';
import { api } from '../core/api.js';

const TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA'];

export function mount(root) {
  const query   = field({ placeholder: 'example.com  or  8.8.8.8', value: '' });
  const results = h('div', { class: 'mt-4 space-y-4' });
  const errors  = h('div', { class: 'mt-3' });
  const boxes   = TYPES.map((t) => checkbox('dns-' + t, t, ['A', 'AAAA', 'MX', 'TXT', 'NS'].indexOf(t) !== -1));

  let controller = null;

  function table(title, rows, columns) {
    const body = h('tbody', {});
    rows.forEach((record) => {
      body.appendChild(h('tr', {}, columns.map((col) =>
        h('td', { class: col === 'value' || col === 'target' ? 'mono break-all' : '', text: String(record[col] === undefined ? '' : record[col]) })
      )));
    });
    return h('div', { class: 'card overflow-x-auto' },
      h('div', { class: 'mb-2 flex items-center justify-between' },
        h('h3', { class: 'font-semibold text-slate-900 dark:text-white', text: title }),
        ghost('Copy', { onclick: () => copy(rows.map((r) => columns.map((c) => r[c]).join('\t')).join('\n')) })
      ),
      h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, columns.map((c) => h('th', { text: c.toUpperCase() })))),
        body
      )
    );
  }

  async function run() {
    errors.textContent = '';
    results.textContent = '';
    const value = query.value.trim();
    if (!value) return;

    if (controller) controller.abort();
    controller = new AbortController();

    const selected = boxes.filter((b) => b.input.checked).map((b) => b.querySelector('span').textContent);
    const loading = h('p', { class: 'flex items-center gap-2 text-sm text-slate-500' }, h('span', { class: 'spinner' }), 'Resolving...');
    results.appendChild(loading);

    try {
      const data = await api('dns.php', {
        json: { query: value, types: selected },
        signal: controller.signal
      });

      results.textContent = '';

      if (data.ip) {
        results.appendChild(table('IP information', [data.ip], Object.keys(data.ip)));
      }

      TYPES.forEach((type) => {
        const rows = (data.records && data.records[type]) || [];
        if (!rows.length) return;
        results.appendChild(table(type + ' records', rows, Object.keys(rows[0])));
      });

      if (!results.childNodes.length) {
        results.appendChild(alertBox('info', 'No records were returned for that query.'));
      }
    } catch (err) {
      results.textContent = '';
      if (err.name !== 'AbortError') errors.appendChild(alertBox('error', err.message));
    }
  }

  query.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });

  root.append(
    h('div', { class: 'grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end' },
      h('div', {}, h('span', { class: 'label', text: 'Domain or IP address' }), query),
      btn('Look up', { onclick: run })
    ),
    h('div', { class: 'mt-3' },
      h('span', { class: 'label', text: 'Record types' }),
      h('div', { class: 'flex flex-wrap gap-x-4 gap-y-2' }, boxes)
    ),
    errors,
    results
  );

  return () => { if (controller) controller.abort(); };
}
