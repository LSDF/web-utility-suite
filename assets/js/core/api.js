/**
 * assets/js/core/api.js
 * The ONLY place the front end talks to the network.
 *
 * Every call goes to a same-origin PHP endpoint under /api/. No third party
 * host, no API key, no token is ever referenced in this bundle - the PHP proxy
 * attaches credentials server side.
 */

const BASE = '/api/';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function handle(response) {
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text); } catch (e) { payload = null; }

  if (!response.ok || (payload && payload.ok === false)) {
    const message = (payload && payload.error)
      ? payload.error
      : 'Request failed with status ' + response.status;
    throw new ApiError(message, response.status, payload);
  }
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

/** JSON POST/GET helper. */
export async function api(endpoint, options) {
  const opts = options || {};
  const init = {
    method: opts.method || (opts.json ? 'POST' : 'GET'),
    headers: { 'X-Requested-With': 'fetch' },
    signal: opts.signal,
    credentials: 'same-origin'
  };

  if (opts.json) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.json);
  }

  let url = BASE + endpoint;
  if (opts.query) {
    const qsParams = new URLSearchParams(opts.query).toString();
    if (qsParams) url += (url.indexOf('?') === -1 ? '?' : '&') + qsParams;
  }

  const response = await fetch(url, init);
  return handle(response);
}

/** multipart/form-data upload helper (document converters). */
export async function upload(endpoint, formData, options) {
  const opts = options || {};
  const response = await fetch(BASE + endpoint, {
    method: 'POST',
    body: formData,
    signal: opts.signal,
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'fetch' }
  });
  return handle(response);
}

export { ApiError };
