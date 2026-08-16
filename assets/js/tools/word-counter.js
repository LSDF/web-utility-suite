/**
 * assets/js/tools/word-counter.js
 * Live word / character / sentence statistics, keyword density and
 * reading + speaking time estimates. Unicode aware, fully offline.
 */
import { h, area, ghost, row, field, copy, download } from '../core/dom.js';

const SEGMENTER = (typeof Intl !== 'undefined' && Intl.Segmenter)
  ? new Intl.Segmenter(undefined, { granularity: 'word' })
  : null;

const STOP_WORDS = new Set(('a an the and or but if then than that this these those of in on at to for with '
  + 'from by as is are was were be been being it its he she they we you i not no do does did have has had will '
  + 'would can could should may might there their our your his her them us me my').split(' '));

function countWords(text) {
  if (!text.trim()) return [];
  if (SEGMENTER) {
    const out = [];
    for (const seg of SEGMENTER.segment(text)) {
      if (seg.isWordLike) out.push(seg.segment.toLowerCase());
    }
    return out;
  }
  return text.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) || [];
}

function readable(minutes) {
  if (minutes < 1) return Math.max(1, Math.round(minutes * 60)) + ' sec';
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return m + ' min' + (s ? ' ' + s + ' sec' : '');
}

export function mount(root) {
  const input = area({ rows: 14, placeholder: 'Paste or type your text. Everything updates as you type.' });
  const wpm   = field({ type: 'number', value: 230, min: 80, max: 1000, step: 10 });
  const cards = h('div', { class: 'mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4' });
  const density = h('div', { class: 'mt-6' });

  function stat(labelText, valueText, hint) {
    return h('div', { class: 'card' },
      h('p', { class: 'text-xs font-medium uppercase tracking-wide text-slate-500', text: labelText }),
      h('p', { class: 'mt-1 text-2xl font-bold text-slate-900 dark:text-white', text: valueText }),
      hint ? h('p', { class: 'hint mt-0.5', text: hint }) : null
    );
  }

  function update() {
    const text = input.value;
    const words = countWords(text);
    const chars = Array.from(text).length;
    const charsNoSpaces = Array.from(text.replace(/\s/g, '')).length;
    const sentences = (text.match(/[^.!?\n]+[.!?]+(\s|$)|[^.!?\n]+$/g) || []).filter((s) => s.trim()).length;
    const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim()).length;
    const unique = new Set(words).size;
    const speed = Number(wpm.value) || 230;

    cards.textContent = '';
    cards.append(
      stat('Words', String(words.length), unique + ' unique'),
      stat('Characters', String(chars), charsNoSpaces + ' without spaces'),
      stat('Sentences', String(sentences), paragraphs + ' paragraph(s)'),
      stat('Reading time', readable(words.length / speed), 'at ' + speed + ' wpm'),
      stat('Speaking time', readable(words.length / 130), 'at 130 wpm'),
      stat('Avg word length', words.length ? (charsNoSpaces / words.length).toFixed(1) : '0', 'characters'),
      stat('Avg sentence', sentences ? (words.length / sentences).toFixed(1) : '0', 'words'),
      stat('Longest word', words.reduce((a, b) => (b.length > a.length ? b : a), ''), '')
    );

    // keyword density, stop words removed
    const freq = new Map();
    words.forEach((word) => {
      if (word.length < 3 || STOP_WORDS.has(word)) return;
      freq.set(word, (freq.get(word) || 0) + 1);
    });
    const top = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);

    density.textContent = '';
    if (top.length) {
      const body = h('tbody', {});
      top.forEach((pair) => {
        const pct = ((pair[1] / Math.max(1, words.length)) * 100).toFixed(2);
        body.appendChild(h('tr', {},
          h('td', { class: 'mono', text: pair[0] }),
          h('td', { text: String(pair[1]) }),
          h('td', { text: pct + ' %' })
        ));
      });
      density.append(
        h('h2', { class: 'text-lg font-semibold text-slate-900 dark:text-white', text: 'Keyword density' }),
        h('div', { class: 'card mt-2 overflow-x-auto' },
          h('table', { class: 'table' },
            h('thead', {}, h('tr', {}, h('th', { text: 'Term' }), h('th', { text: 'Count' }), h('th', { text: 'Density' }))),
            body
          )
        )
      );
    }
  }

  input.addEventListener('input', update);
  wpm.addEventListener('input', update);

  root.append(
    h('div', {}, h('span', { class: 'label', text: 'Your text' }), input),
    row(
      h('div', { class: 'w-40' }, h('span', { class: 'label', text: 'Reading speed (wpm)' }), wpm),
      ghost('Copy text', { onclick: () => copy(input.value) }),
      ghost('Download .txt', { onclick: () => download('text.txt', input.value, 'text/plain') }),
      ghost('Clear', { onclick: () => { input.value = ''; update(); } })
    ),
    cards,
    density
  );

  update();
  return () => {};
}
