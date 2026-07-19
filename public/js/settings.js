/* ==========================================================
   Settings page — Super Admin only.
   Tabs: General, Departments & Teams, Audit Log
   ========================================================== */

let SETTINGS_TAB = 'general';

async function loadSettings() {
  const target = document.getElementById('pageContent');
  if (!target) return setTimeout(loadSettings, 50);
  if (Auth.getUser().role !== 'super_admin') {
    target.innerHTML = `<div class="card"><div class="empty-state"><h4>Restricted</h4><p>Only Super Admin can access Settings.</p></div></div>`;
    return;
  }

  target.innerHTML = `
    <div class="tabs" id="settingsTabs">
      <button class="tab active" data-tab="general">General</button>
      <button class="tab" data-tab="orgs">Departments &amp; Teams</button>
      <button class="tab" data-tab="audit">Audit Log</button>
    </div>
    <div id="settingsTabBody"><div class="skeleton" style="height:300px;"></div></div>
  `;

  document.getElementById('settingsTabs').addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    SETTINGS_TAB = e.target.dataset.tab;
    document.querySelectorAll('#settingsTabs .tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    renderSettingsTab();
  });

  renderSettingsTab();
}

async function renderSettingsTab() {
  const body = document.getElementById('settingsTabBody');
  body.innerHTML = `<div class="skeleton" style="height:300px;"></div>`;
  if (SETTINGS_TAB === 'general') return renderGeneralTab(body);
  if (SETTINGS_TAB === 'orgs') return renderOrgsTab(body);
  if (SETTINGS_TAB === 'audit') return renderAuditTab(body);
}

/* ---------------- General ---------------- */
async function renderGeneralTab(body) {
  try {
    const { settings } = await Api.get('/settings');
    body.innerHTML = `
      <div class="two-col">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px;">Company</div>
          <div class="field"><label>Company name</label><input id="sCompanyName" value="${escapeHtml(settings.company_name)}"></div>
          <div class="field"><label>QA pass percentage</label><input id="sPassPct" type="number" min="0" max="100" step="0.5" value="${settings.qa_pass_percentage}"></div>
          <div class="field">
            <label>Logo</label>
            <div class="flex-gap">
              ${settings.logo_path ? `<img src="${settings.logo_path}" alt="Logo" style="height:36px;border-radius:6px;">` : `<span class="text-faint" style="font-size:12px;">No logo uploaded</span>`}
              <input type="file" id="sLogoFile" accept="image/*" style="max-width:220px;">
            </div>
          </div>
          <button class="btn btn-teal btn-sm" id="saveGeneralBtn">Save changes</button>
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:14px;">Appearance</div>
          <div class="flex-between">
            <div><div style="font-weight:600;font-size:13px;">Dark mode</div><div class="text-faint" style="font-size:11.5px;">Applies to your browser only.</div></div>
            <label class="switch"><input type="checkbox" id="sDarkMode" ${document.documentElement.getAttribute('data-theme')==='dark'?'checked':''}><span class="switch-track"></span></label>
          </div>
        </div>
      </div>
    `;

    document.getElementById('sDarkMode').addEventListener('change', (e) => Theme.apply(e.target.checked ? 'dark' : 'light'));

    document.getElementById('saveGeneralBtn').addEventListener('click', async () => {
      try {
        await Api.put('/settings', {
          company_name: document.getElementById('sCompanyName').value.trim(),
          qa_pass_percentage: Number(document.getElementById('sPassPct').value),
        });
        const file = document.getElementById('sLogoFile').files[0];
        if (file) {
          const fd = new FormData();
          fd.append('logo', file);
          await Api.postForm('/settings/logo', fd);
        }
        toast('Settings saved.');
        renderGeneralTab(body);
      } catch {}
    });
  } catch (err) {
    body.innerHTML = `<div class="card"><div class="empty-state"><h4>Couldn't load settings</h4><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

/* ---------------- Departments & Teams ---------------- */
async function renderOrgsTab(body) {
  try {
    const [{ departments }, { teams }] = await Promise.all([Api.get('/departments'), Api.get('/teams')]);
    body.innerHTML = `
      <div class="two-col">
        <div class="card">
          <div class="flex-between" style="margin-bottom:12px;"><div class="card-title">Departments</div><button class="btn btn-ghost btn-sm" id="addDeptBtn">+ Add</button></div>
          ${departments.map(d => `<div class="stat-row"><span>${escapeHtml(d.name)}</span></div>`).join('') || '<p class="text-faint">No departments yet.</p>'}
        </div>
        <div class="card">
          <div class="flex-between" style="margin-bottom:12px;"><div class="card-title">Teams</div><button class="btn btn-ghost btn-sm" id="addTeamBtn">+ Add</button></div>
          ${teams.map(t => `<div class="stat-row"><span>${escapeHtml(t.name)}</span><span class="text-faint" style="font-size:11.5px;">${escapeHtml(t.department_name||'—')}</span></div>`).join('') || '<p class="text-faint">No teams yet.</p>'}
        </div>
      </div>
    `;
    document.getElementById('addDeptBtn').addEventListener('click', async () => {
      const name = prompt('Department name:');
      if (!name) return;
      try { await Api.post('/departments', { name }); toast('Department created.'); renderOrgsTab(body); } catch {}
    });
    document.getElementById('addTeamBtn').addEventListener('click', async () => {
      const name = prompt('Team name:');
      if (!name) return;
      const deptId = prompt('Department ID for this team (see list on the left):\n' + departments.map(d=>`${d.id} = ${d.name}`).join('\n'));
      if (!deptId) return;
      try { await Api.post('/teams', { name, department_id: Number(deptId) }); toast('Team created.'); renderOrgsTab(body); } catch {}
    });
  } catch (err) {
    body.innerHTML = `<div class="card"><div class="empty-state"><h4>Couldn't load organization data</h4><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

/* ---------------- Audit log ---------------- */
async function renderAuditTab(body) {
  try {
    const { logs } = await Api.get('/audit');
    body.innerHTML = `
      <div class="card card-flush">
        ${logs.length ? `<div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>When</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>${logs.map(l => `<tr><td class="mono">${new Date(l.created_at).toLocaleString()}</td><td>${escapeHtml(l.user_name||'System')}</td><td>${escapeHtml(l.action)}</td><td class="text-mute">${escapeHtml(l.details||'')}</td></tr>`).join('')}</tbody>
        </table></div>` : `<div class="empty-state"><h4>No activity yet</h4></div>`}
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div class="card"><div class="empty-state"><h4>Couldn't load the audit log</h4><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(loadSettings, 30));
