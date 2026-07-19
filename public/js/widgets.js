/* ==========================================================
   Shared visual helpers used across dashboard/evaluations/reports.
   ========================================================== */

function scoreColorHex(score) {
  if (score >= 90) return '#0E9C8C';
  if (score >= 75) return '#DE9A34';
  return '#D6524B';
}
function scoreBadgeClass(score) {
  if (score >= 90) return 'teal';
  if (score >= 75) return 'amber';
  return 'red';
}

function scoreRing(score, { size = 80, stroke = 8, valueSize = 16 } = {}) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const col = scoreColorHex(s);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (s / 100) * c;
  return `
  <div class="ring-wrap" style="width:${size}px;height:${size}px;">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg);">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border-soft)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </svg>
    <div class="ring-value" style="font-size:${valueSize}px;color:${col}">${Math.round(s)}</div>
  </div>`;
}

function passFailBadge(passFail) {
  const cls = passFail === 'Pass' ? 'teal' : 'red';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${passFail}</span>`;
}
function statusBadge(status) {
  const map = { completed: 'teal', draft: 'amber', disputed: 'red', reopened: 'blue' };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge ${map[status] || 'grey'}"><span class="badge-dot"></span>${label}</span>`;
}
function roleBadge(role) {
  const map = { super_admin: 'blue', qa_evaluator: 'teal', team_lead: 'amber', agent: 'grey' };
  return `<span class="badge ${map[role] || 'grey'}">${role.replace('_', ' ')}</span>`;
}
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/* ---------------- Shared modal ---------------- */
function openModal(html) {
  const box = document.getElementById('modalBox');
  const overlay = document.getElementById('modalOverlay');
  if (!box || !overlay) return;
  box.innerHTML = html;
  overlay.classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
}
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('modalOverlay');
  overlay?.addEventListener('click', (e) => { if (e.target.id === 'modalOverlay') closeModal(); });
});
