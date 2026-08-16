/**
 * assets/js/tools/json-formatter.js - beautify, minify, validate, sort, stats.
 */
import { h, area, btn, ghost, row, select, copy, download, alertBox, bytes } from '../core/dom.js';

function positionOf(text, index) {
  const upto = text.slice(0, index);
  const line = upto.split('\n').length;
  const col  = index - upto.lastIndexOf('\n');
  return { line: line, col: col };
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = sortDeep(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function stats(value) {
  let keys = 0, nodes = 0, depth = 0;
  (function walk(node, level) {
    nodes += 1;
    depth = Math.max(depth, level);
    if (Array.isArray(node)) node.forEach((item) => walk(item, level + 1));
    else if (node && typeof node === 'object') {
      Object.keys(node).forEach((key) => { keys += 1; walk(node[key], level + 1); });
    }
  })(value, 1);
  return { keys: keys, nodes: nodes, depth: depth };
}

export function mount(root) {
  const input  = area({ rows: 14, placeholder: '{"hello":"world","items":[1,2,3]}' });
  const output = area({ rows: 14, readonly: true });
  const notes  = h('div', { class: 'mt-3 space-y-2' });

  const indent = select({}, [['2', '2 spaces'], ['4', '4 spaces'], ['tab', 'Tab'], ['0', 'Minified']]);

  function parse() {
    notes.textContent = '';
    const text = input.value.trim();
    if (!text) { output.value = ''; return null; }
    try {
      return JSON.parse(text);
    } catch (err) {
      const match = /position (\d+)/.exec(err.message);
      let detail = err.message;
      if (match) {
        const pos = positionOf(input.value, Number(match[1]));
        detail += '  ->  line ' + pos.line + ', column ' + pos.col;
      }
      notes.appendChild(alertBox('error', 'Invalid JSON: ' + detail));
      output.value = '';
      return null;
    }
  }

  function stringify(value) {
    if (indent.value === '0') return JSON.stringify(value);
    const space = indent.value === 'tab' ? '\t' : Number(indent.value);
    return JSON.stringify(value, null, space);
  }

  function report(value) {
    const s = stats(value);
    notes.appendChild(alertBox('success',
      'Valid JSON. ' + s.nodes + ' nodes, ' + s.keys + ' keys, max depth ' + s.depth +
      ', ' + bytes(new Blob([output.value]).size) + ' formatted.'));
  }

  function format() {
    const value = parse();
    if (value === null) return;
    output.value = stringify(value);
    report(value);
  }

  function minify() {
    const value = parse();
    if (value === null) return;
    output.value = JSON.stringify(value);
    report(value);
  }

  function sortKeys() {
    const value = parse();
    if (value === null) return;
    output.value = stringify(sortDeep(value));
    report(value);
  }

  function validate() {
    const value = parse();
    if (value !== null) {
      output.value = stringify(value);
      report(value);
    }
  }

  root.append(
    h('div', { class: 'grid gap-4 lg:grid-cols-2' },
      h('div', {}, h('span', { class: 'label', text: 'JSON input' }), input),
      h('div', {},
        h('div', { class: 'mb-1 flex items-center justify-between' },
          h('span', { class: 'label mb-0', text: 'Result' }),
          h('div', { class: 'flex gap-2' },
            ghost('Copy', { onclick: () => copy(output.value) }),
            ghost('Download', { onclick: () => download('formatted.json', output.value, 'application/json') })
          )
        ),
        output
      )
    ),
    h('div', { class: 'mt-4 space-y-3' },
      row(
        btn('Format', { onclick: format }),
        ghost('Minify', { onclick: minify }),
        ghost('Sort keys', { onclick: sortKeys }),
        ghost('Validate', { onclick: validate }),
        ghost('Clear', { onclick: () => { input.value = ''; output.value = ''; notes.textContent = ''; } })
      ),
      h('div', { class: 'max-w-xs' }, h('span', { class: 'label', text: 'Indentation' }), indent),
      notes
    )
  );

  return () => {};
}
