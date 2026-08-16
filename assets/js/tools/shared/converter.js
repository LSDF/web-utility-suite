/**
 * assets/js/tools/shared/converter.js
 * Shared UI for the document converters. The browser uploads to
 * /api/convert.php only; that PHP script is the single place that knows the
 * conversion vendor and holds the API key.
 */
import { h, btn, ghost, row, alertBox, bytes, download, toast } from '../../core/dom.js';
import { upload } from '../../core/api.js';

export function converter(config) {
  return function mount(root) {
    const fileInput = h('input', { type: 'file', class: 'hidden', accept: config.accept });
    const chosen    = h('p', { class: 'hint mt-2' });
    const errors    = h('div', { class: 'mt-3' });
    const progress  = h('div', { class: 'mt-3 hidden' },
      h('div', { class: 'meter' }, h('span', {})),
      h('p', { class: 'hint mt-1', text: 'Converting...' })
    );

    const dropzone = h('div', { class: 'dropzone cursor-pointer' },
      h('p', { class: 'text-sm font-medium text-slate-700 dark:text-slate-200', text: config.dropLabel }),
      h('p', { class: 'hint mt-1', text: 'Maximum ' + config.maxMb + ' MB. Files are deleted from the server immediately after conversion.' })
    );

    let file = null;
    let controller = null;

    function setFile(next) {
      errors.textContent = '';
      if (!next) return;
      if (next.size > config.maxMb * 1024 * 1024) {
        errors.appendChild(alertBox('error', 'That file is ' + bytes(next.size) + '. The limit is ' + config.maxMb + ' MB.'));
        return;
      }
      const ok = config.extensions.some((ext) => next.name.toLowerCase().endsWith(ext));
      if (!ok) {
        errors.appendChild(alertBox('error', 'Expected one of: ' + config.extensions.join(', ')));
        return;
      }
      file = next;
      chosen.textContent = 'Selected: ' + file.name + ' (' + bytes(file.size) + ')';
      convertBtn.disabled = false;
    }

    async function convert() {
      if (!file) return;
      errors.textContent = '';
      progress.classList.remove('hidden');
      progress.querySelector('span').style.width = '35%';
      convertBtn.disabled = true;
      controller = new AbortController();

      const form = new FormData();
      form.append('file', file);
      form.append('target', config.target);
      form.append('source', config.source);

      try {
        const data = await upload('convert.php', form, { signal: controller.signal });
        progress.querySelector('span').style.width = '100%';

        if (data.url) {
          // The proxy returns a short lived signed download URL.
          const link = h('a', {
            href: data.url, class: 'btn btn-primary mt-3 inline-flex',
            download: data.filename || config.outputName, rel: 'noopener'
          }, 'Download ' + (data.filename || config.outputName));
          errors.appendChild(h('div', {}, alertBox('success', 'Conversion finished.'), link));
        } else if (data.base64) {
          const binary = atob(data.base64);
          const arr = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) arr[i] = binary.charCodeAt(i);
          download(data.filename || config.outputName, new Blob([arr], { type: data.mime || 'application/octet-stream' }));
          errors.appendChild(alertBox('success', 'Conversion finished and the download has started.'));
        } else {
          errors.appendChild(alertBox('error', 'The converter returned an unexpected response.'));
        }
        toast('Done');
      } catch (err) {
        if (err.name !== 'AbortError') errors.appendChild(alertBox('error', err.message));
      } finally {
        progress.classList.add('hidden');
        progress.querySelector('span').style.width = '0%';
        convertBtn.disabled = false;
      }
    }

    const convertBtn = btn(config.buttonLabel, { onclick: convert });
    convertBtn.disabled = true;

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => setFile(fileInput.files[0]));

    ['dragenter', 'dragover'].forEach((evt) => dropzone.addEventListener(evt, (e) => {
      e.preventDefault(); dropzone.classList.add('is-dragging');
    }));
    ['dragleave', 'drop'].forEach((evt) => dropzone.addEventListener(evt, (e) => {
      e.preventDefault(); dropzone.classList.remove('is-dragging');
    }));
    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) setFile(e.dataTransfer.files[0]);
    });

    root.append(
      dropzone, fileInput, chosen,
      row(convertBtn, ghost('Reset', {
        onclick: () => {
          file = null; fileInput.value = ''; chosen.textContent = '';
          errors.textContent = ''; convertBtn.disabled = true;
        }
      })),
      progress,
      errors,
      h('div', { class: 'mt-4' }, alertBox('info', config.privacyNote))
    );

    return () => { if (controller) controller.abort(); };
  };
}
