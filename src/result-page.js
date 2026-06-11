// ── Result Page — shows/hides #result, wires action buttons ──────────
import { el } from './utils.js';
import { goToWizardStep } from './wizard.js';
import { copyResultSummary } from './copy-result.js';
import { analyze } from './analyze.js';
import { resetAccordionState } from './accordion.js';
import { updateFreeBoostProgress } from './free-boost.js';

export function initResultPage() {
  el('result-adjust')?.addEventListener('click', () => {
    hideResultPage();
    goToWizardStep(0);
  });
  el('result-copy')?.addEventListener('click', () => copyResultSummary());
  el('result-rerun')?.addEventListener('click', () => {
    hideResultPage();
    analyze();
  });
}

function showResultStep() {
  goToWizardStep(3);
}

export function showResultPage() {
  const r = el('result');
  r.classList.add('show');
  showResultStep();

  // Reset accordions: first 3 sections always open, rest closed
  resetAccordionState();
  updateFreeBoostProgress();

  setTimeout(() => r.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}

export function hideResultPage() {
  const r = el('result');
  if (r) r.classList.remove('show');
}
