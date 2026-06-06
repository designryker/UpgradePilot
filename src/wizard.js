// ── Wizard step management ────────────────────────────────────────────
import { el, inTr } from './utils.js';
import { currentLang } from './state.js';
import { I18N } from './i18n.js';
import { clamp } from './utils.js';

export const WIZARD_STEPS = [
  { id: 'goal',   labelKey: 'stepGoal' },
  { id: 'specs',  labelKey: 'stepSpecs' },
  { id: 'budget', labelKey: 'stepBudget' },
  { id: 'result', labelKey: 'stepResult' },
];

export let currentWizardStep = 0;

export function setCurrentWizardStep(v) { currentWizardStep = v; }

export function renderWizardProgress() {
  const progress = el('wizard-progress');
  if (!progress) return;
  progress.innerHTML = WIZARD_STEPS.map((step, index) => {
    const cls      = index === currentWizardStep ? 'active' : index < currentWizardStep ? 'done' : '';
    const disabled = index > currentWizardStep ? 'disabled' : '';
    const label    = I18N[currentLang][step.labelKey] || step.id;
    return '<button type="button" class="wizard-pill ' + cls + '" data-wizard-step="' + index + '" ' + disabled + '>' +
      '<span>' + String(index + 1).padStart(2, '0') + '</span>' + label +
    '</button>';
  }).join('');
}

export function goToWizardStep(index, scroll = true) {
  currentWizardStep = clamp(index, 0, WIZARD_STEPS.length - 1);
  const wizard      = el('wizard');
  if (wizard) wizard.dataset.currentStep = String(currentWizardStep);

  const activeStepId = WIZARD_STEPS[currentWizardStep].id;
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.classList.toggle('active', step.dataset.step === activeStepId);
  });

  const back = el('wizard-back');
  const next = el('wizard-next');
  if (back) back.disabled = currentWizardStep === 0;
  if (next) next.style.display = currentWizardStep >= WIZARD_STEPS.length - 2 ? 'none' : '';

  renderWizardProgress();
  if (scroll) wizard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function nextWizardStep() { goToWizardStep(currentWizardStep + 1); }
export function prevWizardStep() { goToWizardStep(currentWizardStep - 1); }
export function showResultStep() { goToWizardStep(WIZARD_STEPS.length - 1, false); }

export function initWizard({ onRerun, onCopyResult, onAdjust }) {
  renderWizardProgress();
  goToWizardStep(0, false);

  el('wizard-next')?.addEventListener('click', nextWizardStep);
  el('wizard-back')?.addEventListener('click', prevWizardStep);
  el('wizard-progress')?.addEventListener('click', event => {
    const pill = event.target.closest('[data-wizard-step]');
    if (!pill || pill.disabled) return;
    goToWizardStep(Number(pill.dataset.wizardStep));
  });

  el('result-adjust')?.addEventListener('click', () => goToWizardStep(0));
  el('result-rerun')?.addEventListener('click', onRerun);
  el('result-copy')?.addEventListener('click', onCopyResult);
}
