/* ==========================================================
   Reports page — /api/reports + /api/export/{csv,excel,pdf}
   ========================================================== */

let reportChart = null;
const CHANNELS_R = ['Email', 'Live Chat', 'Facebook', 'Instagram', 'WhatsApp', 'Voice'];

async function initReports() {
  const target = document.getElementById('pageContent');
  if (!target) return setTimeout(initReports, 50);

  target.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="flex-between" style="margin-bottom:12px;">
        <div class="pill-toggle" id="periodToggle">
          <button data-p="daily">Daily</button>
          <button data-p="weekly">Weekly</button>
          <button data-p="monthly" class="active">Monthly</button>
          <button data-p="quarterly">Quarterly</button>
          <button data-p="yearly">Yearly</button>
        </div>
        <div class="flex-gap">
          <button class="btn btn-ghost btn-sm" id="exportCsv">Export CSV</button>
          <button class="btn btn-ghost btn-sm" id="exportExcel">Export Excel</button>
          <button class="btn btn-ghost btn-sm" id="exportPdf">Export PDF</button>
        </div>
      </div>
      <div class="filter-row" style="margin-bottom:0;">
        <div class="field"><label>Channel</label><select id="rChannel"><option value="">All</option>${CHANNELS_R.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>From</label><input type="date" id="rFrom"></div>
        <div class="field"><label>To</label><input type="date" id="rTo"></div>
        <button class="btn btn-ghost btn-sm" id="applyReportFilters">Apply</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:14px;">Score &amp; Volume by Period</div>
      <canvas id="reportChart" height="90"></canvas>
    </div>
    <div class="card card-flush section-gap" id="reportTableCard"></div>
  `;

  document.getElementById('periodToggle').addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    document.querySelectorAll('#periodToggle button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    loadReport();
  });
  document.getElementById('applyReportFilters').addEventListener('click', loadReport);
  document.getElementById('exportCsv').addEventListener('click', () => Api.download(`/export/csv${currentFilterQuery()}`, 'qa-report.csv'));
  document.getElementById('exportExcel').addEventListener('click', () => Api.download(`/export/excel${currentFilterQuery()}`, 'qa-report.xlsx'));
  document.getElementById('exportPdf').addEventListener('click', () => Api.download(`/export/pdf${currentFilterQuery()}`, 'qa-report.pdf'));

  loadReport();
}

function currentPeriod() { return document.querySelector('#periodToggle button.active')?.dataset.p || 'monthly'; }
function currentFilterQuery() {
  const params = new URLSearchParams();
  const channel = document.getElementById('rChannel').value;
  const from = document.getElementById('rFrom').value;
  const to = document.getElementById('rTo').value;
  if (channel) params.set('channel', channel);
  if (from) params.set('dateFrom', from);
  if (to) params.set('dateTo', to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function loadReport() {
  const period = currentPeriod();
  const params = new URLSearchParams(currentFilterQuery().replace('?', ''));
  params.set('period', period);
  const tableCard = document.getElementById('reportTableCard');
  tableCard.innerHTML = `<div class="skeleton" style="height:220px;margin:20px;"></div>`;

  try {
    const { rows } = await Api.get(`/reports?${params.toString()}`);
    buildReportChart(rows);
    tableCard.innerHTML = rows.length ? `
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Period</th><th>Evaluations</th><th>Avg Score</th><th>Passed</th><th>Failed</th><th>Pass Rate</th></tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td class="mono">${r.period}</td><td>${r.evaluations}</td><td><span class="badge ${scoreBadgeClass(r.averageScore)}">${r.averageScore}%</span></td><td>${r.passed}</td><td>${r.failed}</td><td>${r.passRate}%</td></tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state"><h4>No data for this range</h4><p>Try widening the date range or clearing filters.</p></div>`;
  } catch (err) {
    tableCard.innerHTML = `<div class="empty-state"><h4>Couldn't load the report</h4><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function buildReportChart(rows) {
  const ctx = document.getElementById('reportChart')?.getContext('2d');
  if (!ctx) return;
  if (reportChart) reportChart.destroy();
  reportChart = new Chart(ctx, {
    data: {
      labels: rows.map(r => r.period),
      datasets: [
        { type: 'bar', label: 'Evaluations', data: rows.map(r => r.evaluations), backgroundColor: '#E8EEFD', yAxisID: 'y1', borderRadius: 4 },
        { type: 'line', label: 'Avg Score', data: rows.map(r => r.averageScore), borderColor: '#0E9C8C', backgroundColor: '#0E9C8C', tension: .35, yAxisID: 'y' },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 100, position: 'left', grid: { color: '#EDF0F5' } },
        y1: { min: 0, position: 'right', grid: { display: false } },
        x: { grid: { display: false } },
      },
    },
  });
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initReports, 30));
