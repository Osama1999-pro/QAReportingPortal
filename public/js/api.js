/* ==========================================================
   API client — every page includes this before its own script.
   Token + user are kept in localStorage so a full page reload
   (this is a classic multi-page app, not an SPA) stays logged in.
   ========================================================== */

const AUTH_TOKEN_KEY = 'qa_portal_token';
const AUTH_USER_KEY = 'qa_portal_user';

const Auth = {
  getToken(){ return localStorage.getItem(AUTH_TOKEN_KEY); },
  getUser(){ try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY)); } catch { return null; } },
  setSession(token, user){ localStorage.setItem(AUTH_TOKEN_KEY, token); localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)); },
  clearSession(){ localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem(AUTH_USER_KEY); },
  isLoggedIn(){ return !!this.getToken(); },
  /** Call at the top of every protected page. Redirects to login if not authenticated. */
  requirePage(){
    if (!this.isLoggedIn()) { window.location.href = '/index.html'; return null; }
    return this.getUser();
  },
};

const Api = {
  base: '/api',

  async request(path, { method = 'GET', body, isForm = false } = {}) {
    const headers = {};
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isForm) headers['Content-Type'] = 'application/json';

    let res;
    try {
      res = await fetch(this.base + path, {
        method,
        headers,
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      });
    } catch (err) {
      toast('Network error — is the server running?', 'error');
      throw err;
    }

    if (res.status === 401 && !path.startsWith('/auth/login')) {
      Auth.clearSession();
      window.location.href = '/index.html';
      return;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // file downloads (csv/xlsx/pdf)
      if (!res.ok) { toast('Export failed.', 'error'); throw new Error('Export failed'); }
      return res;
    }

    const data = await res.json();
    if (!res.ok || data.success === false) {
      const msg = data.message || 'Something went wrong.';
      toast(msg, 'error');
      const err = new Error(msg);
      err.payload = data;
      throw err;
    }
    return data;
  },

  get(path){ return this.request(path); },
  post(path, body){ return this.request(path, { method: 'POST', body }); },
  put(path, body){ return this.request(path, { method: 'PUT', body }); },
  patch(path, body){ return this.request(path, { method: 'PATCH', body }); },
  delete(path){ return this.request(path, { method: 'DELETE' }); },
  postForm(path, formData){ return this.request(path, { method: 'POST', body: formData, isForm: true }); },

  /** Triggers a real file download for CSV/Excel/PDF export endpoints. */
  async download(path, filename) {
    const res = await this.request(path);
    if (!res || !(res instanceof Response)) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
};

function toast(msg, type = 'success') {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : ''}`;
  el.innerHTML = `<span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3200);
}

/* ---------------- Theme ---------------- */
const Theme = {
  key: 'qa_portal_theme',
  apply(theme){ document.documentElement.setAttribute('data-theme', theme); localStorage.setItem(this.key, theme); },
  init(){ this.apply(localStorage.getItem(this.key) || 'light'); },
  toggle(){ this.apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); },
};
Theme.init();
