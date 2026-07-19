/* ==========================================================
   Dashboard page — GET /api/dashboard/summary
   ========================================================== */

let trendChart = null, teamChart = null;

async function loadDashboard() {
  const target = document.getElementById('pageContent');
  if (!target) return setTimeout(loadDashboard, 50); // wait for shell to render
  target.innerHTML = `<div class="skeleton" style="height:400px;"></div>`;

  try {
    const { summary, monthlyTrend, teamPerformance, topPerformers, lowestPerformers } = await Api.get('/dashboard/summary');
    target.innerHTML = dashboardTemplate(summary, topPerformers, lowestPerformers);
    buildTrendChart(monthlyTrend);
    buildTeamChart(teamPerformance);
  } catch (err) {
    target.innerHTML = `<div class="card"><div class="empty-state"><h4>Couldn't load the dashboard</h4><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

function dashboardTemplate(s, top, bottom) {
  return `
    <div class="grid grid-4">
      <div class="card">
        <div class="kpi-label">Overall QA Score</div>
        <div style="display:flex;align-items:center;gap:16px;margin-top:8px;">
          ${scoreRing(s.averageScore, { size: 70, stroke: 7, valueSize: 15 })}
          <div>
            <div class="kpi-value" style="font-size:22px;">${s.averageScore}<span style="font-size:13px;color:var(--text-faint);">/100</span></div>
            <div class="text-faint" style="font-size:11.5px;">${s.totalEvaluations} evaluations logged</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="kpi-label">Pass Rate</div>
        <div class="kpi-value">${s.passRate}%</div>
        <div class="text-faint" style="font-size:11.5px;margin-top:4px;">${s.passed} passed &middot; ${s.failed} failed</div>
      </div>
      <div class="card">
        <div class="kpi-label">Coaching Required</div>
        <div class="kpi-value" style="color:var(--red);">${s.coachingRequired}</div>
        <div class="text-faint" style="font-size:11.5px;margin-top:4px;">agents below pass threshold</div>
      </div>
      <div class="card">
        <div class="kpi-label">Completed / Pending</div>
        <div class="kpi-value">${s.completed}<span style="font-size:13px;color:var(--text-faint);"> / ${s.pending}</span></div>
        <div class="text-faint" style="font-size:11.5px;margin-top:4px;">evaluation status</div>
      </div>
    </div>

    <div class="two-col section-gap">
      <div class="card">
        <div class="card-head">
          <div><div class="card-title">Monthly QA Trend</div><div class="card-sub">last 6 months</div></div>
        </div>
        <canvas id="trendChart" height="230"></canvas>
      </div>
      <div class="card">
        <div class="card-title">Top Performing Agents</div>
        <div style="margin-top:10px;">
          ${(top||[]).map(a => `<div class="stat-row"><span>${escapeHtml(a.agent_name)}</span><span class="badge ${scoreBadgeClass(a.avg_score)} mono">${a.avg_score}</span></div>`).join('') || '<p class="text-faint">No data yet.</p>'}
        </div>
        <div class="card-title" style="margin-top:18px;">Lowest Performing Agents</div>
        <div style="margin-top:10px;">
          ${(bottom||[]).map(a => `<div class="stat-row"><span>${escapeHtml(a.agent_name)}</span><span class="badge ${scoreBadgeClass(a.avg_score)} mono">${a.avg_score}</span></div>`).join('') || '<p class="text-faint">No data yet.</p>'}
        </div>
      </div>
    </div>

    <div class="card section-gap">
      <div class="card-head"><div><div class="card-title">Team Performance</div><div class="card-sub">average QA score by team</div></div></div>
      <canvas id="teamChart" height="90"></canvas>
    </div>
  `;
}

function buildTrendChart(rows) {
  const ctx = document.getElementById('trendChart')?.getContext('2d');
  if (!ctx) return;
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels: rows.map(r => r.period), datasets: [{ label: 'Avg Score', data: rows.map(r => r.avg_score), borderColor: '#0E9C8C', backgroundColor: 'rgba(14,156,140,0.08)', fill: true, tension: .35, pointRadius: 3 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, grid: { color: '#EDF0F5' } }, x: { grid: { display: false } } } },
  });
}
function buildTeamChart(rows) {
  const ctx = document.getElementById('teamChart')?.getContext('2d');
  if (!ctx) return;
  if (teamChart) teamChart.destroy();
  teamChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: rows.map(r => r.team_name || 'Unassigned'), datasets: [{ data: rows.map(r => r.avg_score), backgroundColor: rows.map(r => scoreColorHex(r.avg_score)), borderRadius: 6, maxBarThickness: 46 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, grid: { color: '#EDF0F5' } }, x: { grid: { display: false } } } },
  });
}

document.addEventListener('DOMContentLoaded', () => setTimeout(loadDashboard, 30));
