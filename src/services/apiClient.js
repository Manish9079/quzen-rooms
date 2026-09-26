const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, retry = true } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  try { payload = await response.json(); } catch { /* empty response */ }

  // /auth/me is also protected: restore an existing session when its short-lived
  // access cookie expires, without retrying login or registration requests.
  if (response.status === 401 && retry &&
      (!path.startsWith('/auth/') || path === '/auth/me')) {
    const refreshed = await request('/auth/refresh', { method: 'POST', retry: false }).catch(() => null);
    if (refreshed) return request(path, { method, body, retry: false });
  }

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = payload?.details;
    throw error;
  }

  return payload?.data;
}

function query(params = {}) {
  const values = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  const search = new URLSearchParams(values).toString();
  return search ? `?${search}` : '';
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  query,
};

export { BASE_URL };
