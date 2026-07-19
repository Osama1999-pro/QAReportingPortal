/* ==========================================================
   Shell — injects the sidebar + topbar into any page that has
   <div id="appShell" data-page="..." data-title="..." data-crumb="..."></div>
   ========================================================== */

const NAV_ITEMS = [
  { page: 'dashboard', href: '/dashboard.html', label: 'Dashboard', roles: null,
    icon: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>' },
  { page: 'evaluations', href: '/evaluations.html', label: 'Evaluations', roles: null,
    icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>' },
  { page: 'coaching', href: '/coaching.html', label: 'Coaching', roles: null,
    icon: '<path d="M12 2a5 5 0 015 5v2a5 5 0 01-10 0V7a5 5 0 015-5z"/><path d="M5 21v-2a7 7 0 0114 0v2"/>' },
  { page: 'reports', href: '/reports.html', label: 'Reports & Analytics', roles: null,
    icon: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-4"/>' },
  { page: 'employees', href: '/employees.html', label: 'Employees', roles: ['super_admin', 'qa_evaluator', 'team_lead'],
    icon: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>' },
  { page: 'settings', href: '/settings.html', label: 'Settings', roles: ['super_admin'],
    icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.36.51.87.87 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>' },
];

function initials(name){ return (name||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase(); }

function renderShell() {
  const shell = document.getElementById('appShell');
  if (!shell) return;
  const user = Auth.requirePage();
  if (!user) return;

  const page = shell.dataset.page;
  const title = shell.dataset.title || '';
  const crumb = shell.dataset.crumb || `qa-portal / ${page}`;

  const items = NAV_ITEMS.filter(i => !i.roles || i.roles.includes(user.role));

  shell.innerHTML = `
    <div class="sidebar-scrim" id="sidebarScrim"></div>
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark"><span>QA</span></div>
        <div>
          <div class="brand-name" id="brandName">QA Portal</div>
          <div class="brand-sub">Reporting Portal</div>
        </div>
      </div>
      <nav class="nav">
        ${items.map(i => `
          <a class="nav-item ${i.page===page?'active':''}" href="${i.href}">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${i.icon}</svg>
            ${i.label}
          </a>`).join('')}
      </nav>
      <div class="sidebar-foot">
        <div class="sidebar-user">
          <div class="avatar">${initials(user.name)}</div>
          <div>
            <div class="sidebar-user-name">${user.name}</div>
            <div class="sidebar-user-role">${user.role.replace('_',' ')}</div>
          </div>
        </div>
        <button class="logout-btn" id="logoutBtn">Log out</button>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <div class="flex-gap">
          <button class="icon-btn menu-toggle" id="menuToggle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <div>
            <div class="page-title">${title}</div>
            <div class="page-crumb">${crumb}</div>
          </div>
        </div>
        <div class="topbar-right">
          <button class="icon-btn" id="themeToggle" title="Toggle theme">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
        </div>
      </div>
      <div class="content" id="pageContent"></div>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await Api.post('/auth/logout'); } catch {}
    Auth.clearSession();
    window.location.href = '/index.html';
  });
  document.getElementById('themeToggle').addEventListener('click', () => Theme.toggle());
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarScrim').classList.add('open');
  });
  document.getElementById('sidebarScrim')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarScrim').classList.remove('open');
  });

  // pull the real company name for the brand label
  Api.get('/settings').then(({ settings }) => {
    if (settings?.company_name) document.getElementById('brandName').textContent = settings.company_name;
  }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', renderShell);
