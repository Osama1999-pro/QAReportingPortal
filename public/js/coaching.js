/* ==========================================================
   Coaching page — /api/coaching
   Agents see only their own sessions (server-scoped).
   Super Admin / QA Evaluator / Team Lead can log new sessions.
   ========================================================== */

let COACH_AGENTS = [];

async function loadCoaching() {
  const target = document.getElementById('pageContent');
  if (!target) return setTimeout(loadCoaching, 50);
  const user = Auth.getUser();
  const canCreate = ['super_admin', 'qa_evaluator', 'team_lead'].includes(user.role);

  target.innerHTML = `<div class="skeleton" style="height:400px;"></div>`;

  try {
    const [{ sessions }, agentsRes] = await Promise.all([
      Api.get('/coaching'),
      canCreate ? Api.get('/users?role=agent&status=active') : Promise.resolve({ users: [] }),
    ]);
    COACH_AGENTS = agentsRes.users;

    target.innerHTML = `
      <div class="card card-flush">
        <div class="flex-between" style="padding:18px 20px;">
          <div><div class="card-title">Coaching Sessions</div><div class="card-sub">${sessions.length} logged</div></div>
          ${canCreate ? `<button class="btn btn-teal btn-sm" id="addCoachingBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Log Session</button>` : ''}
        </div>
        ${sessions.length ? `<div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Employee</th><th>Coach</th><th>Date</th><th>Reason</th><th>Follow-up</th><th>Status</th></tr></thead>
          <tbody>
            ${sessions.map(s => `
              <tr>
                <td>${escapeHtml(s.employee_name)}</td>
                <td>${escapeHtml(s.coach_name)}</td>
                <td class="mono">${fmtDate(s.coaching_date)}</td>
                <td style="max-width:280px;">${escapeHtml(s.reason)}</td>
                <td class="mono">${s.follow_up_date ? fmtDate(s.follow_up_date) : '—'}</td>
                <td><span class="badge ${s.status==='completed'?'teal':'amber'}"><span class="badge-dot"></span>${s.status}</span></td>
              </tr>`).join('')}
          </tbody>
        </table></div>` : `<div class="empty-state"><h4>No coaching sessions yet</h4><p>Sessions logged after low-scoring evaluations will appear here.</p></div>`}
      </div>
    `;
    document.getElementById('addCoachingBtn')?.addEventListener('click', openCoachingModal);
  } catch (err) {
    target.innerHTML = `<div class="card"><div class="empty-state"><h4>Couldn't load coaching sessions</h4><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

function openCoachingModal() {
  openModal(`
    <div class="modal-head"><h3>Log Coaching Session</h3><button class="icon-btn" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>Employee</label>
        <select id="cEmployee">${COACH_AGENTS.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select>
      </div>
      <div class="grid grid-2">
        <div class="field"><label>Coaching date</label><input type="date" id="cDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Follow-up date</label><input type="date" id="cFollowUp"></div>
      </div>
      <div class="field"><label>Reason</label><textarea id="cReason" rows="2" placeholder="e.g. Policy compliance score below target."></textarea></div>
      <div class="field"><label>Action plan</label><textarea id="cAction" rows="3" placeholder="What will the employee and coach do about it?"></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-teal" id="saveCoachingBtn">Save session</button>
    </div>
  `);

  document.getElementById('saveCoachingBtn').addEventListener('click', async () => {
    const payload = {
      employee_id: Number(document.getElementById('cEmployee').value),
      coaching_date: document.getElementById('cDate').value,
      follow_up_date: document.getElementById('cFollowUp').value || null,
      reason: document.getElementById('cReason').value.trim(),
      action_plan: document.getElementById('cAction').value.trim(),
    };
    if (!payload.reason || !payload.action_plan) { toast('Reason and action plan are required.', 'error'); return; }
    try {
      await Api.post('/coaching', payload);
      toast('Coaching session logged.');
      closeModal();
      loadCoaching();
    } catch {}
  });
}

document.addEventListener('DOMContentLoaded', () => setTimeout(loadCoaching, 30));
