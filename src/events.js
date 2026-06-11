// ── Event binding ─────────────────────────────────────────────────────
import { el } from './utils.js';
import { setLanguage } from './language.js';
import { updateMemoryCompatibility, updateRamSpeeds } from './memory-compat.js';
import { updateSystemTypeFields } from './system-type.js';
import { updateBudgetPresets, setBudgetPreset, detectDisplay } from './budget-display.js';
import { filterSelectOptions, quickPick, setVirtualPcPart, updateVirtualPcSummary, updatePartTierBadge } from './ui-parts.js';
import { toggleCheck } from './free-boost.js';
import { setHasTouchedSpecs } from './state.js';
import { analyze } from './analyze.js';
import { detectAndApplyGpu } from './gpu-detect.js';

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

  el('psu-unknown-check')?.addEventListener('change', () => {
    const checked    = el('psu-unknown-check').checked;
    const sliderWrap = el('psu-slider-wrap');
    const note       = el('psu-unknown-note');
    const watts      = el('psu-watts');
    if (sliderWrap) sliderWrap.style.display = checked ? 'none' : '';
    if (note)       note.style.display       = checked ? '' : 'none';
    if (watts)      watts.value              = checked ? '0' : '650';
    const readout = el('psu-readout');
    if (readout && !checked) readout.textContent = '650';
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
  document.querySelectorAll('[data-filter-select]').forEach(input => {
    input.addEventListener('input', event => {
      const selectId = input.dataset.filterSelect;
      const select   = document.getElementById(selectId);
      // Dropdown açıkken DOM'a dokunma
      if (select && select._dropdownOpen) return;
      filterSelectOptions(selectId, event.target.value);
      updatePartTierBadge(selectId);
    });
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

  // GPU auto-detect
  el('gpu-detect-btn')?.addEventListener('click', () => {
    const btn      = el('gpu-detect-btn');
    const feedback = el('gpu-detect-feedback');
    if (!btn || !feedback) return;

    btn.disabled   = true;
    btn.textContent = '…';

    detectAndApplyGpu({
      onSuccess(raw, key, label) {
        updatePartTierBadge('gpu');
        setHasTouchedSpecs(true);
        feedback.hidden    = false;
        feedback.className = 'gpu-detect-feedback gpu-detect-ok';
        feedback.textContent = '✓ Detected: ' + label;
        btn.textContent  = '⚡ Detect';
        btn.disabled     = false;
      },
      onNotFound(raw) {
        feedback.hidden    = false;
        feedback.className = 'gpu-detect-feedback gpu-detect-warn';
        feedback.textContent = 'GPU found (' + raw.slice(0, 40) + ') but not in database. Select manually.';
        btn.textContent  = '⚡ Detect';
        btn.disabled     = false;
      },
      onError(msg) {
        feedback.hidden    = false;
        feedback.className = 'gpu-detect-feedback gpu-detect-err';
        feedback.textContent = 'Could not detect GPU. Select manually.';
        btn.textContent  = '⚡ Detect';
        btn.disabled     = false;
      }
    });
  });

  el('checklist')?.addEventListener('click', event => {
    const row = event.target.closest('.ci[data-check-id]');
    if (row) toggleCheck(Number(row.dataset.checkId));
  });
}
