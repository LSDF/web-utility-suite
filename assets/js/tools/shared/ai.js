/**
 * assets/js/tools/shared/ai.js
 * Shared UI for the AI tools. Everything is posted to /api/ai.php, which is
 * the only component that knows the provider URL, the model and the key.
 */
import { h, area, btn, ghost, row, select, copy, download, alertBox } from '../../core/dom.js';
import { api } from '../../core/api.js';

const MAX_CHARS = 12000;

export function aiTool(config) {
  return function mount(root) {
    const input   = area({ rows: 12, placeholder: config.placeholder });
    const output  = h('div', { class: 'card mt-4 hidden whitespace-pre-wrap text-sm leading-relaxed' });
    const errors  = h('div', { class: 'mt-3' });
    const counter = h('p', { class: 'hint mt-1' });

    const optionA = select({}, config.optionA.choices);
    const optionB = select({}, config.optionB.choices);

    let controller = null;

    function updateCount() {
      const len = input.value.length;
      counter.textContent = len + ' / ' + MAX_CHARS + ' characters';
      counter.style.color = len > MAX_CHARS ? '#dc2626' : '';
    }

    async function run() {
      errors.textContent = '';
      const text = input.value.trim();
      if (!text) { errors.appendChild(alertBox('error', 'Please paste some ' + config.noun + ' first.')); return; }
      if (text.length > MAX_CHARS) { errors.appendChild(alertBox('error', 'Input is too long. Trim it to ' + MAX_CHARS + ' characters.')); return; }

      if (controller) controller.abort();
      controller = new AbortController();

      runBtn.disabled = true;
      output.classList.remove('hidden');
      output.textContent = '';
      output.appendChild(h('p', { class: 'flex items-center gap-2 text-slate-500' }, h('span', { class: 'spinner' }), 'Thinking...'));

      try {
        const data = await api('ai.php', {
          json: {
            task: config.task,
            input: text,
            optionA: optionA.value,
            optionB: optionB.value
          },
          signal: controller.signal
        });

        output.textContent = data.output || '(empty response)';
        actions.classList.remove('hidden');
      } catch (err) {
        output.classList.add('hidden');
        if (err.name !== 'AbortError') errors.appendChild(alertBox('error', err.message));
      } finally {
        runBtn.disabled = false;
      }
    }

    const runBtn = btn(config.buttonLabel, { onclick: run });

    const actions = row(
      ghost('Copy result', { onclick: () => copy(output.textContent) }),
      ghost('Download .md', { onclick: () => download(config.task + '.md', output.textContent, 'text/markdown') })
    );
    actions.classList.add('hidden', 'mt-3');

    input.addEventListener('input', updateCount);

    root.append(
      h('div', {}, h('span', { class: 'label', text: config.inputLabel }), input, counter),
      h('div', { class: 'mt-4 grid gap-3 sm:grid-cols-2' },
        h('div', {}, h('span', { class: 'label', text: config.optionA.label }), optionA),
        h('div', {}, h('span', { class: 'label', text: config.optionB.label }), optionB)
      ),
      row(runBtn, ghost('Clear', {
        onclick: () => { input.value = ''; output.classList.add('hidden'); actions.classList.add('hidden'); errors.textContent = ''; updateCount(); }
      })),
      errors,
      output,
      actions,
      h('div', { class: 'mt-4' }, alertBox('info',
        'This request is sent to /api/ai.php on this domain. The API key lives in config/secrets.php on the server and is never present in any JavaScript file, network request or page source.'))
    );

    updateCount();
    return () => { if (controller) controller.abort(); };
  };
}
