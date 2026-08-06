// Thin fetch wrapper around the real Quzen Rooms API. Auth is cookie-based
// (httpOnly access/refresh tokens set by the backend), so every request
// goes with credentials: 'include' rather than manually attaching a token.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let onUnauthorized = null;
/** Lets AuthContext react (e.g. clear user state) whenever any request 401s. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = 'GET', body, headers = {}, skipAuthRedirect = false } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try { payload = await res.json(); } catch { /* empty body, e.g. some 204s */ }

  if (!res.ok || !payload?.success) {
    if (res.status === 401 && !skipAuthRedirect) onUnauthorized?.();
    const message = payload?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.details = payload?.details;
    throw error;
  }

  return payload.data;
}

function toQueryString(params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

export const apiClient = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...opts }),
  delete: (path, opts) => request(path, { method: 'DELETE', ...opts }),
  toQueryString,
};

export { BASE_URL };
