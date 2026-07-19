/* ==========================================================
   Evaluation scorecard — create or edit.
   ?id=123 in the URL switches this into edit mode.
   ========================================================== */

const EVAL_ID = new URLSearchParams(window.location.search).get('id');
let SCORECARD_ROWS = []; // [{section_key, section_label, max_score, obtained_score, comments}]
let AGENTS = [];

async function loadForm() {
  const target = document.getElementById('pageContent');
  if (!target) return setTimeout(loadForm, 50);
  const user = Auth.getUser();
  const readOnly = !['super_admin', 'qa_evaluator'].includes(user.role);

  target.innerHTML = `<div class="skeleton" style="height:500px;"></div>`;

  try {
    const [{ template, channels }, { users: agents }] = await Promise.all([
      Api.get('/evaluations/scorecard-template'),
      Api.get('/users?role=agent&status=active'),
    ]);
    AGENTS = agents;

    let evaluation = null;
    if (EVAL_ID) {
      const res = await Api.get(`/evaluations/${EVAL_ID}`);
      evaluation = res.evaluation;
      SCORECARD_ROWS = evaluation.scorecard.map(s => ({ ...s }));
    } else {
      SCORECARD_ROWS = template.map(t => ({ ...t, obtained_score: t.max_score, comments: '' }));
    }

    target.innerHTML = formTemplate(evaluation, channels, readOnly);
    wireForm(evaluation, readOnly);
    recalcTotals();
  } catch (err) {
    target.innerHTML = `<div class="card"><div class="empty-state"><h4>Couldn't load the evaluation form</h4><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

function formTemplate(evaluation, channels, readOnly) {
  return `
    <div class="two-col">
      <div>
        <div class="card">
          <div class="card-title" style="margin-bottom:14px;">Interaction Details</div>
          <div class="grid grid-2">
            <div class="field"><label>Agent</label>
              <select id="fAgent" ${readOnly?'disabled':''}>
                <option value="">Select agent…</option>
                ${AGENTS.map(a => `<option value="${a.id}" data-team="${a.team_id||''}" ${evaluation?.agent_id===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}
              </select>
            </div>
            <div class="field"><label>Channel</label>
              <select id="fChannel" ${readOnly?'disabled':''}>
                ${channels.map(c => `<option ${evaluation?.channel===c?'selected':''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="grid grid-2">
            <div class="field"><label>Ticket number</label><input id="fTicket" value="${escapeHtml(evaluation?.ticket_number||'')}" ${readOnly?'disabled':''}></div>
            <div class="field"><label>Order number</label><input id="fOrder" value="${escapeHtml(evaluation?.order_number||'')}" ${readOnly?'disabled':''}></div>
          </div>
          <div class="field"><label>Evaluation date</label><input type="date" id="fDate" value="${evaluation?.evaluation_date || new Date().toISOString().slice(0,10)}" ${readOnly?'disabled':''}></div>
        </div>

        <div class="card section-gap">
          <div class="card-title" style="margin-bottom:14px;">Scorecard</div>
          <div id="scorecardWrap">
            ${SCORECARD_ROWS.map((row, i) => `
              <div class="param-block">
                <div class="param-head">
                  <span class="param-name">${escapeHtml(row.section_label)}</span>
                  <span class="param-weight">max ${row.max_score}</span>
                </div>
                <div class="grid grid-2" style="margin-top:8px;">
                  <div class="field" style="margin-bottom:0;">
                    <label>Obtained score</label>
                    <input type="number" class="score-input" data-index="${i}" min="0" max="${row.max_score}" step="0.5" value="${row.obtained_score}" ${readOnly?'disabled':''}>
                  </div>
                  <div class="field" style="margin-bottom:0;">
                    <label>Comments</label>
                    <input type="text" class="comment-input" data-index="${i}" value="${escapeHtml(row.comments||'')}" placeholder="Optional" ${readOnly?'disabled':''}>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="field"><label>Overall comments</label><textarea id="fOverallComments" rows="3" ${readOnly?'disabled':''}>${escapeHtml(evaluation?.overall_comments||'')}</textarea></div>
        </div>
      </div>

      <div>
        <div class="card" style="position:sticky;top:80px;">
          <div class="card-title" style="margin-bottom:14px;">Result</div>
          <div style="display:flex;align-items:center;gap:16px;">
            <div id="resultRing"></div>
            <div>
              <div id="resultPercent" class="kpi-value" style="font-size:26px;"></div>
              <div id="resultPassFail" style="margin-top:4px;"></div>
            </div>
          </div>
          <div class="stat-row"><span class="text-mute">Total obtained</span><span class="mono" id="totalObtained"></span></div>
          <div class="stat-row"><span class="text-mute">Total possible</span><span class="mono" id="totalMax"></span></div>
          ${!readOnly ? `
            <button class="btn btn-teal section-gap" style="width:100%;justify-content:center;" id="submitEvalBtn">${evaluation ? 'Save changes' : 'Submit evaluation'}</button>
          ` : `<div class="section-gap text-faint" style="font-size:12px;">This evaluation is read-only for your role.</div>`}
          ${evaluation ? `<div class="text-faint mono section-gap" style="font-size:11px;">${evaluation.evaluation_code}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function recalcTotals() {
  const totalMax = SCORECARD_ROWS.reduce((s, r) => s + Number(r.max_score), 0);
  const totalObtained = SCORECARD_ROWS.reduce((s, r) => s + Number(r.obtained_score), 0);
  const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

  const ringEl = document.getElementById('resultRing');
  if (ringEl) ringEl.innerHTML = scoreRing(pct, { size: 66, stroke: 6, valueSize: 14 });
  const pctEl = document.getElementById('resultPercent');
  if (pctEl) pctEl.textContent = `${pct}%`;
  const pfEl = document.getElementById('resultPassFail');
  if (pfEl) pfEl.innerHTML = passFailBadge(pct >= 80 ? 'Pass' : 'Fail'); // visual estimate; server applies the real configured threshold
  const tm = document.getElementById('totalMax'); if (tm) tm.textContent = totalMax;
  const to = document.getElementById('totalObtained'); if (to) to.textContent = totalObtained;
}

function wireForm(evaluation, readOnly) {
  if (readOnly) return;

  document.querySelectorAll('.score-input').forEach(input => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.index);
      let val = Number(input.value);
      const max = Number(SCORECARD_ROWS[i].max_score);
      if (val > max) { val = max; input.value = max; }
      if (val < 0) { val = 0; input.value = 0; }
      SCORECARD_ROWS[i].obtained_score = val;
      recalcTotals();
    });
  });
  document.querySelectorAll('.comment-input').forEach(input => {
    input.addEventListener('input', () => {
      SCORECARD_ROWS[Number(input.dataset.index)].comments = input.value;
    });
  });

  document.getElementById('submitEvalBtn').addEventListener('click', async () => {
    const agentId = document.getElementById('fAgent').value;
    if (!agentId) { toast('Please select an agent.', 'error'); return; }

    const selectedOption = document.getElementById('fAgent').selectedOptions[0];
    const payload = {
      agent_id: Number(agentId),
      team_id: selectedOption.dataset.team ? Number(selectedOption.dataset.team) : null,
      channel: document.getElementById('fChannel').value,
      ticket_number: document.getElementById('fTicket').value.trim(),
      order_number: document.getElementById('fOrder').value.trim(),
      evaluation_date: document.getElementById('fDate').value,
      overall_comments: document.getElementById('fOverallComments').value.trim(),
      scorecard: SCORECARD_ROWS.map(r => ({
        section_key: r.section_key, section_label: r.section_label,
        max_score: r.max_score, obtained_score: r.obtained_score, comments: r.comments,
      })),
    };

    const btn = document.getElementById('submitEvalBtn');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      if (evaluation) {
        await Api.put(`/evaluations/${evaluation.id}`, payload);
        toast('Evaluation updated.');
      } else {
        await Api.post('/evaluations', payload);
        toast('Evaluation submitted.');
      }
      window.location.href = '/evaluations.html';
    } catch {
      btn.disabled = false; btn.textContent = evaluation ? 'Save changes' : 'Submit evaluation';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => setTimeout(loadForm, 30));
