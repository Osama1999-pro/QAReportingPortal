/* ==========================================================
   Employees page — /api/users, /api/departments, /api/teams
   Create/edit/delete are Super Admin only; everyone else views.
   ========================================================== */

let ALL_DEPARTMENTS = [], ALL_TEAMS = [], ALL_MANAGERS = [];

async function loadEmployees() {
  const target = document.getElementById('pageContent');
  if (!target) return setTimeout(loadEmployees, 50);
  const user = Auth.getUser();
  const canManage = user.role === 'super_admin';

  target.innerHTML = `<div class="skeleton" style="height:400px;"></div>`;

  try {
    const [{ users }, { departments }, { teams }] = await Promise.all([
      Api.get('/users'), Api.get('/departments'), Api.get('/teams'),
    ]);
    ALL_DEPARTMENTS = departments; ALL_TEAMS = teams;
    ALL_MANAGERS = users.filter(u => ['team_lead', 'super_admin'].includes(u.role));

    target.innerHTML = `
      <div class="card card-flush">
        <div class="flex-between" style="padding:18px 20px;">
          <div>
            <div class="card-title">All Employees</div>
            <div class="card-sub">${users.length} accounts</div>
          </div>
          ${canManage ? `<button class="btn btn-teal btn-sm" id="addEmployeeBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Employee</button>` : ''}
        </div>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Team</th><th>Designation</th><th>Status</th>${canManage ? '<th></th>' : ''}</tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><div style="font-weight:600;">${escapeHtml(u.name)}</div><div class="text-faint mono" style="font-size:11px;">${escapeHtml(u.employee_code || u.email)}</div></td>
                  <td>${roleBadge(u.role)}</td>
                  <td>${escapeHtml(u.department_name || '—')}</td>
                  <td>${escapeHtml(u.team_name || '—')}</td>
                  <td>${escapeHtml(u.designation || '—')}</td>
                  <td>${u.status === 'active' ? '<span class="badge teal"><span class="badge-dot"></span>Active</span>' : '<span class="badge grey"><span class="badge-dot"></span>Deactivated</span>'}</td>
                  ${canManage ? `<td>
                    <button class="btn btn-ghost btn-sm" onclick="editEmployee(${u.id})">Edit</button>
                    <button class="btn ${u.status==='active'?'btn-danger-ghost':'btn-ghost'} btn-sm" onclick="toggleStatus(${u.id}, '${u.status}')">${u.status==='active'?'Deactivate':'Activate'}</button>
                  </td>` : ''}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('addEmployeeBtn')?.addEventListener('click', () => openEmployeeModal(null));
  } catch (err) {
    target.innerHTML = `<div class="card"><div class="empty-state"><h4>Couldn't load employees</h4><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

function deptTeamOptions(selectedDept, selectedTeam) {
  return `
    <div class="grid grid-2">
      <div class="field">
        <label>Department</label>
        <select id="fDepartment">
          <option value="">— None —</option>
          ${ALL_DEPARTMENTS.map(d => `<option value="${d.id}" ${d.id===selectedDept?'selected':''}>${escapeHtml(d.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Team</label>
        <select id="fTeam">
          <option value="">— None —</option>
          ${ALL_TEAMS.map(t => `<option value="${t.id}" ${t.id===selectedTeam?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
    </div>`;
}

function openEmployeeModal(existing) {
  const isEdit = !!existing;
  openModal(`
    <div class="modal-head">
      <h3>${isEdit ? 'Edit Employee' : 'Add Employee'}</h3>
      <button class="icon-btn" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="grid grid-2">
        <div class="field"><label>Employee ID</label><input id="fCode" value="${escapeHtml(existing?.employee_code || '')}"></div>
        <div class="field"><label>Full name</label><input id="fName" value="${escapeHtml(existing?.name || '')}" required></div>
      </div>
      <div class="grid grid-2">
        <div class="field"><label>Email</label><input id="fEmail" type="email" value="${escapeHtml(existing?.email || '')}" required></div>
        <div class="field"><label>Phone</label><input id="fPhone" value="${escapeHtml(existing?.phone || '')}"></div>
      </div>
      ${deptTeamOptions(existing?.department_id, existing?.team_id)}
      <div class="grid grid-2">
        <div class="field"><label>Designation</label><input id="fDesignation" value="${escapeHtml(existing?.designation || '')}"></div>
        <div class="field">
          <label>Role</label>
          <select id="fRole">
            ${['agent','team_lead','qa_evaluator','super_admin'].map(r => `<option value="${r}" ${existing?.role===r?'selected':''}>${r.replace('_',' ')}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label>Manager</label>
        <select id="fManager">
          <option value="">— None —</option>
          ${ALL_MANAGERS.map(m => `<option value="${m.id}" ${m.id===existing?.manager_id?'selected':''}>${escapeHtml(m.name)}</option>`).join('')}
        </select>
      </div>
      ${!isEdit ? `<div class="field"><label>Temporary password</label><input id="fPassword" type="text" placeholder="Leave blank for default: Welcome123!"></div>` : ''}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-teal" id="saveEmployeeBtn">${isEdit ? 'Save changes' : 'Create employee'}</button>
    </div>
  `);

  document.getElementById('saveEmployeeBtn').addEventListener('click', async () => {
    const payload = {
      employee_code: document.getElementById('fCode').value.trim(),
      name: document.getElementById('fName').value.trim(),
      email: document.getElementById('fEmail').value.trim(),
      phone: document.getElementById('fPhone').value.trim(),
      department_id: document.getElementById('fDepartment').value || null,
      team_id: document.getElementById('fTeam').value || null,
      designation: document.getElementById('fDesignation').value.trim(),
      role: document.getElementById('fRole').value,
      manager_id: document.getElementById('fManager').value || null,
    };
    if (!payload.name || !payload.email) { toast('Name and email are required.', 'error'); return; }

    try {
      if (isEdit) {
        await Api.put(`/users/${existing.id}`, payload);
        toast('Employee updated.');
      } else {
        payload.password = document.getElementById('fPassword')?.value.trim() || undefined;
        await Api.post('/users', payload);
        toast('Employee created.');
      }
      closeModal();
      loadEmployees();
    } catch { /* toast already shown by Api */ }
  });
}

async function editEmployee(id) {
  try {
    const { user } = await Api.get(`/users/${id}`);
    openEmployeeModal(user);
  } catch {}
}

async function toggleStatus(id, currentStatus) {
  const next = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    await Api.patch(`/users/${id}/status`, { status: next });
    toast(`Employee ${next === 'active' ? 'activated' : 'deactivated'}.`);
    loadEmployees();
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => setTimeout(loadEmployees, 30));
