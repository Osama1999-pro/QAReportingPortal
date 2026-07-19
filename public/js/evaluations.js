/* ==========================================================
   Evaluations page — /api/evaluations
   Agents/team leads automatically see only their scoped data
   (enforced server-side); this page just renders whatever comes back.
   ========================================================== */

let EVAL_PAGE = 1;
const CHANNELS = ['Email', 'Live Chat', 'Facebook', 'Instagram', 'WhatsApp', 'Voice'];

async function loadEvaluations(page = 1) {
  EVAL_PAGE = page;
  const target = document.getElementById('pageContent');
  if (!target) return setTimeout(() => loadEvaluations(page), 50);
  const user = Auth.getUser();
  const canCreate = ['super_admin', 'qa_evaluator'].includes(user.role);

  if (!target.dataset.filtersReady) {
    target.innerHTML = filterBarTemplate(canCreate) + `<div class="card card-flush" id="evalTableCard"><div class="skeleton" style="height:300px;margin:20px;"></div></div>`;
    target.dataset.filtersReady = '1';
    wireFilterBar();
  }

  const params = new URLSearchParams();
  params.set('page', page); params.set('pageSize', 10);
  for (const [k, id] of Object.entries({ channel: 'fChannel', status: 'fStatus', passFail: 'fResult', dateFrom: 'fFrom', dateTo: 'fTo', search: 'fSearch' })) {
    const val = document.getElementById(id)?.value;
    if (val) params.set(k, val);
  }

  try {
    const { evaluations, pagination } = await Api.get(`/evaluations?${params.toString()}`);
    document.getElementById('evalTableCard').innerHTML = tableTemplate(evaluations, pagination, canCreate);
  } catch (err) {
    document.getElementById('evalTableCard').innerHTML = `<div class="empty-state"><h4>Couldn't load evaluations</h4><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function filterBarTemplate(canCreate) {
  return `
    <div class="flex-between" style="margin-bottom:14px;">
      <div><h2 style="font-size:16px;">All Evaluations</h2></div>
      ${canCreate ? `<a class="btn btn-teal btn-sm" href="/evaluation-form.html">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        New Evaluation</a>` : ''}
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="filter-row">
        <div class="field"><label>Search</label><input id="fSearch" placeholder="Ticket, order #, agent…"></div>
        <div class="field"><label>Channel</label><select id="fChannel"><option value="">All</option>${CHANNELS.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>Status</label><select id="fStatus"><option value="">All</option><option value="completed">Completed</option><option value="draft">Draft</option><option value="disputed">Disputed</option><option value="reopened">Reopened</option></select></div>
        <div class="field"><label>Result</label><select id="fResult"><option value="">All</option><option value="Pass">Pass</option><option value="Fail">Fail</option></select></div>
        <div class="field"><label>From</label><input type="date" id="fFrom"></div>
        <div class="field"><label>To</label><input type="date" id="fTo"></div>
        <button class="btn btn-ghost btn-sm" id="applyFilters">Apply</button>
      </div>
    </div>
  `;
}

function wireFilterBar() {
  document.getElementById('applyFilters').addEventListener('click', () => loadEvaluations(1));
  document.getElementById('fSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadEvaluations(1); });
}

function tableTemplate(rows, pagination, canManage) {
  if (!rows.length) {
    return `<div class="empty-state"><h4>No evaluations found</h4><p>Try adjusting your filters, or create a new evaluation.</p></div>`;
  }
  return `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>Code</th><th>Agent</th><th>Channel</th><th>Evaluator</th><th>Date</th><th>Score</th><th>Result</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${rows.map(e => `
            <tr>
              <td class="mono">${e.evaluation_code}</td>
              <td>${escapeHtml(e.agent_name)}</td>
              <td>${e.channel}</td>
              <td>${escapeHtml(e.evaluator_name)}</td>
              <td class="mono">${fmtDate(e.evaluation_date)}</td>
              <td><span class="badge ${scoreBadgeClass(e.percentage)}">${e.percentage}%</span></td>
              <td>${passFailBadge(e.pass_fail)}</td>
              <td>${statusBadge(e.status)}</td>
              <td>
                <a class="btn btn-ghost btn-sm" href="/evaluation-form.html?id=${e.id}">${canManage ? 'Edit' : 'View'}</a>
                ${e.status !== 'disputed' ? `<button class="btn btn-ghost btn-sm" onclick="disputeEval(${e.id})">Dispute</button>` : ''}
                ${canManage && e.status === 'disputed' ? `<button class="btn btn-ghost btn-sm" onclick="reopenEval(${e.id})">Reopen</button>` : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <span class="text-faint" style="font-size:12px;margin-right:auto;padding-left:20px;">Page ${pagination.page} of ${Math.max(1,pagination.totalPages)} &middot; ${pagination.total} total</span>
      <button class="btn btn-ghost btn-sm" ${pagination.page<=1?'disabled':''} onclick="loadEvaluations(${pagination.page-1})">Prev</button>
      <button class="btn btn-ghost btn-sm" ${pagination.page>=pagination.totalPages?'disabled':''} onclick="loadEvaluations(${pagination.page+1})">Next</button>
    </div>
  `;
}

async function disputeEval(id) {
  const reason = prompt('Briefly describe why you are disputing this evaluation:');
  if (reason === null) return;
  try {
    await Api.post(`/evaluations/${id}/dispute`, { reason });
    toast('Evaluation marked as disputed.');
    loadEvaluations(EVAL_PAGE);
  } catch {}
}
async function reopenEval(id) {
  try {
    await Api.post(`/evaluations/${id}/reopen`);
    toast('Evaluation reopened for corrections.');
    loadEvaluations(EVAL_PAGE);
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => setTimeout(() => loadEvaluations(1), 30));
