// ── System type (desktop / laptop) switching ─────────────────────────
import { el, inTr } from './utils.js';
import { currentLang } from './state.js';
import { I18N } from './i18n.js';
import { renderQuickChipsForMode, applySystemModeToPartSelects, setVirtualPcPart, updateVirtualPcSummary } from './ui-parts.js';
import { updateMemoryCompatibility } from './memory-compat.js';

export function updateSystemTypeFields() {
  const isLaptopMode = el('system-type')?.value === 'laptop';

  const visual = el('pc-visual');
  if (visual) visual.dataset.systemType = isLaptopMode ? 'laptop' : 'desktop';

  renderQuickChipsForMode();
  ['cpu-search', 'gpu-search'].forEach(id => { const n = el(id); if (n) n.value = ''; });
  applySystemModeToPartSelects();

  document.querySelectorAll('.desktop-only').forEach(node => {
    node.classList.toggle('is-hidden', isLaptopMode);
  });
  el('psu-result-section')?.classList.toggle('is-hidden', isLaptopMode);

  const kicker = el('budget-step-kicker');
  const title  = el('budget-step-title');
  const copy   = el('budget-step-copy');
  if (kicker) kicker.textContent = I18N[currentLang][isLaptopMode ? 'laptopBudgetStepKicker' : 'budgetStepKicker'];
  if (title)  title.textContent  = I18N[currentLang][isLaptopMode ? 'laptopBudgetStepTitle'  : 'budgetStepTitle'];
  if (copy)   copy.textContent   = I18N[currentLang][isLaptopMode ? 'laptopBudgetStepCopy'   : 'budgetStepCopy'];

  setVirtualPcPart(
    'system',
    isLaptopMode
      ? (currentLang === 'tr' ? 'Laptop profili' : 'Laptop profile')
      : (currentLang === 'tr' ? 'Mevcut sistem' : 'Current rig')
  );

  updateMemoryCompatibility();
  updateVirtualPcSummary();
}
