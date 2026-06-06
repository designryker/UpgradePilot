// ── Free Boost checklist ──────────────────────────────────────────────
import { el } from './utils.js';

export function toggleCheck(id) {
  const row = el('ci-' + id);
  const box = row.querySelector('.cbox');
  const on  = box.classList.toggle('on');
  box.textContent = on ? '\u2713' : '';
  row.classList.toggle('done', on);
  updateFreeBoostProgress();
}

export function updateFreeBoostProgress() {
  const checks = [...document.querySelectorAll('#checklist .ci[data-check-id]')];
  const done   = checks.filter(row => row.classList.contains('done')).length;
  const total  = checks.length;
  const count  = el('free-boost-count');
  const bar    = el('free-boost-progress');
  if (count) count.textContent = done + '/' + total;
  if (bar)   bar.style.width   = total ? Math.round((done / total) * 100) + '%' : '0%';
}
