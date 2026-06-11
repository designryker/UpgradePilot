// ── Form reset ────────────────────────────────────────────────────────
import { el } from './utils.js';
import { setHasTouchedSpecs, setLatestResultSummary } from './state.js';
import { clearAnalysisSequence } from './analysis-loader.js';
import { setCurrentWizardStep } from './wizard.js';
import { setCopyButtonState } from './copy-result.js';

export function resetInputsToDefaults() {
  setHasTouchedSpecs(false);
  setLatestResultSummary('');
  setCurrentWizardStep(0);

  document.querySelectorAll('select').forEach(select => {
    const def = [...select.options].find(o => o.defaultSelected);
    if (def) select.value = def.value;
    else select.selectedIndex = 0;
    select.querySelectorAll('option,optgroup').forEach(o => {
      o.hidden = false; o.disabled = false;
    });
  });

  document.querySelectorAll('input, textarea').forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = input.defaultChecked; return;
    }
    input.value = input.defaultValue || '';
  });

  document.querySelectorAll('.quick-chip.active,.money-chip.active').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.ci.done').forEach(n => n.classList.remove('done'));
  document.querySelectorAll('.cbox.on').forEach(n => { n.classList.remove('on'); n.textContent = ''; });
  // Clear all toggle buttons on reset
  document.querySelectorAll('.tg-btn').forEach(btn => btn.classList.remove('tg-active'));
  const psuCheck = document.getElementById('psu-unknown-check');
  if (psuCheck && psuCheck.checked) {
    psuCheck.checked = false;
    psuCheck.dispatchEvent(new Event('change'));
  }

  clearAnalysisSequence();
  el('loading-card')?.classList.remove('show', 'is-analyzing');
  el('result')?.classList.remove('show');
  setCopyButtonState(false);
}
