/**
 * assets/js/tools/temp-mail.js
 * 10 minute disposable inbox. All upstream calls go through /api/tempmail.php,
 * so the mail provider never sees the visitor IP and no key sits in this file.
 */
import { h, btn, ghost, row, copy, alertBox, toast } from '../core/dom.js';
import { api } from '../core/api.js';

const STORAGE_KEY = 'wus-tempmail';
const LIFETIME_MS = 10 * 60 * 1000;

export function mount(root) {
  const addressBox = h('code', { class: 'mono min-w-0 flex-1 break-all text-base font-semibold', text: 'No address yet' });
  const timerBox   = h('span', { class: 'rounded-full bg-slate-100 px-3 py-1 text-sm font-medium dark:bg-slate-800', text: '--:--' });
  const list       = h('div', { class: 'mt-4 space-y-2' });
  const errors     = h('div', { class: 'mt-3' });

  let session = null;
  let poll = null;
  let tick = null;
  let seen = new Set();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch (e) { /* private mode */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return (parsed && parsed.expiresAt > Date.now()) ? parsed : null;
    } catch (e) { return null; }
  }

  function renderTimer() {
    if (!session) { timerBox.textContent = '--:--'; return; }
    const left = Math.max(0, session.expiresAt - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    timerBox.textContent = m + ':' + String(s).padStart(2, '0');
    if (left === 0) {
      stop();
      errors.textContent = '';
      errors.appendChild(alertBox('info', 'This inbox expired. Generate a new address to continue.'));
    }
  }

  function stop() {
    clearInterval(poll); clearInterval(tick);
    poll = null; tick = null;
  }

  function start() {
    stop();
    tick = setInterval(renderTimer, 1000);
    poll = setInterval(fetchMessages, 7000);
    renderTimer();
    fetchMessages();
  }

  async function createInbox() {
    errors.textContent = '';
    list.textContent = '';
    seen = new Set();
    try {
      const data = await api('tempmail.php', { json: { action: 'create' } });
      session = {
        address: data.address,
        token: data.token,
        id: data.id,
        expiresAt: Date.now() + LIFETIME_MS
      };
      save();
      addressBox.textContent = session.address;
      start();
      toast('Disposable address ready');
    } catch (err) {
      errors.appendChild(alertBox('error', err.message));
    }
  }

  function extend() {
    if (!session) return;
    session.expiresAt = Date.now() + LIFETIME_MS;
    save();
    renderTimer();
    toast('Extended by 10 minutes');
  }

  function messageCard(message) {
    const body = h('div', { class: 'mt-2 hidden whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300' });
    const card = h('div', { class: 'card' },
      h('button', {
        type: 'button',
        class: 'flex w-full items-start gap-3 text-left',
        onclick: async () => {
          if (body.classList.contains('hidden') && !body.dataset.loaded) {
            body.textContent = 'Loading...';
            try {
              const full = await api('tempmail.php', {
                json: { action: 'message', token: session.token, id: message.id }
              });
              body.textContent = full.text || full.html || '(empty message)';
              body.dataset.loaded = '1';
            } catch (err) { body.textContent = err.message; }
          }
          body.classList.toggle('hidden');
        }
      },
        h('div', { class: 'min-w-0 flex-1' },
          h('p', { class: 'truncate text-sm font-semibold text-slate-900 dark:text-white', text: message.subject || '(no subject)' }),
          h('p', { class: 'truncate text-xs text-slate-500', text: (message.from || 'unknown sender') + '  -  ' + (message.date || '') })
        )
      ),
      body
    );
    return card;
  }

  async function fetchMessages() {
    if (!session) return;
    try {
      const data = await api('tempmail.php', { json: { action: 'messages', token: session.token, id: session.id } });
      (data.messages || []).forEach((message) => {
        if (seen.has(message.id)) return;
        seen.add(message.id);
        list.prepend(messageCard(message));
        toast('New message received');
      });
      if (!list.childNodes.length) {
        list.textContent = '';
        list.appendChild(h('p', { class: 'text-sm text-slate-500', text: 'Waiting for mail. New messages appear here automatically.' }));
      }
    } catch (err) {
      // Silent: polling errors should not spam the UI.
    }
  }

  root.append(
    h('div', { class: 'card flex flex-wrap items-center gap-3' },
      addressBox,
      timerBox,
      ghost('Copy', { onclick: () => copy(addressBox.textContent) })
    ),
    row(
      btn('Generate new address', { onclick: createInbox }),
      ghost('Extend 10 min', { onclick: extend }),
      ghost('Refresh now', { onclick: fetchMessages })
    ),
    errors,
    h('h2', { class: 'mt-6 text-lg font-semibold text-slate-900 dark:text-white', text: 'Inbox' }),
    list,
    h('div', { class: 'mt-4' }, alertBox('info',
      'Disposable inboxes are public by design. Never use one for banking, identity documents or anything you would not post publicly.'))
  );

  const restored = load();
  if (restored) {
    session = restored;
    addressBox.textContent = session.address;
    start();
  } else {
    list.appendChild(h('p', { class: 'text-sm text-slate-500', text: 'Press Generate new address to create a 10 minute inbox.' }));
  }

  return () => stop();
}
