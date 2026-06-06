// ── Event binding ─────────────────────────────────────────────────────
import { el } from './utils.js';
import { setLanguage } from './language.js';
import { updateMemoryCompatibility, updateRamSpeeds } from './memory-compat.js';
import { updateSystemTypeFields } from './system-type.js';
import { updateBudgetPresets, setBudgetPreset, detectDisplay } from './budget-display.js';
import { filterSelectOptions, quickPick, setVirtualPcPart, updateVirtualPcSummary } from './ui-parts.js';
import { toggleCheck } from './free-boost.js';
import { setHasTouchedSpecs } from './state.js';
import { analyze } from './analyze.js';

export function bindEvents() {
  el('lang')?.addEventListener('change', event => setLanguage(event.target.value));
  el('cpu')?.addEventListener('change', updateMemoryCompatibility);
  el('system-type')?.addEventListener('change', updateSystemTypeFields);
  el('ram-type')?.addEventListener('change', updateRamSpeeds);
  el('psu-watts')?.addEventListener('input', () => {
    const readout = el('psu-readout');
    if (readout) readout.textContent = el('psu-watts').value;
    updateVirtualPcSummary();
  });
  el('currency')?.addEventListener('change', updateBudgetPresets);

  // Virtual PC map wiring for form fields
  [
    ['cpu',       'cpu', 'CPU focus'],
    ['cpu-search','cpu', 'CPU search'],
    ['gpu',       'gpu', 'GPU focus'],
    ['gpu-search','gpu', 'GPU search'],
    ['ram',       'ram', 'Memory focus'],
    ['ram-type',  'ram', 'Memory type'],
    ['ram-speed', 'ram', 'Memory speed'],
    ['channel',   'ram', 'Memory channel'],
    ['psu-watts', 'psu', 'Power supply'],
  ].forEach(([id, part, label]) => {
    const node = el(id);
    if (!node) return;
    node.addEventListener('focus',  () => setVirtualPcPart(part, label));
    node.addEventListener('change', () => { setHasTouchedSpecs(true); setVirtualPcPart(part, label); });
    node.addEventListener('input',  () => { setHasTouchedSpecs(true); setVirtualPcPart(part, label); });
  });

  el('budget-content')?.addEventListener('click', event => {
    const card = event.target.closest('[data-focus-part]');
    if (card) setVirtualPcPart(card.dataset.focusPart, card.dataset.focusLabel || card.dataset.focusPart);
  });
  el('budget-content')?.addEventListener('mouseover', event => {
    const card = event.target.closest('[data-focus-part]');
    if (card) setVirtualPcPart(card.dataset.focusPart, card.dataset.focusLabel || card.dataset.focusPart);
  });

  document.querySelectorAll('[data-filter-select]').forEach(input => {
    input.addEventListener('input', event => filterSelectOptions(input.dataset.filterSelect, event.target.value));
  });

  ['cpu-popular', 'gpu-popular'].forEach(gridId => {
    el(gridId)?.addEventListener('click', event => {
      const button = event.target.closest('[data-quick-pick]');
      if (button) quickPick(button.dataset.quickPick, button.dataset.value);
    });
  });

  document.querySelectorAll('[data-budget-preset]').forEach(button => {
    button.addEventListener('click', () => setBudgetPreset(Number(button.dataset.budgetPreset)));
  });

  document.querySelector('[data-action="detect-display"]')?.addEventListener('click', detectDisplay);
  document.querySelector('[data-action="analyze"]')?.addEventListener('click', () => analyze());

  el('checklist')?.addEventListener('click', event => {
    const row = event.target.closest('.ci[data-check-id]');
    if (row) toggleCheck(Number(row.dataset.checkId));
  });
}
