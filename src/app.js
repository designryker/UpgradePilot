import './styles.css';

import { setLanguage, setResultRerenderCallback } from './language.js';
import { initWizard, goToWizardStep } from './wizard.js';
import { bindEvents } from './events.js';
import { initAccordion, initResultGuidance, scrollToUpgradeRecommendation } from './accordion.js';
import { initVirtualPcMap, initClickableFields, updateQuickChips, updateVirtualPcRamMode, updateVirtualPcSummary, setVirtualPcPart, setMemoryCompatibilityUpdater, initTierBadges, updatePartTierBadge } from './ui-parts.js';
import { updateMemoryCompatibility } from './memory-compat.js';
import { updateSystemTypeFields } from './system-type.js';
import { updateBudgetPresets } from './budget-display.js';
import { resetInputsToDefaults } from './reset.js';
import { analyze } from './analyze.js';
import { copyResultSummary } from './copy-result.js';
import { el } from './utils.js';
import { initResultPage } from './result-page.js';

function updatePsuReadout() {
  const readout = el('psu-readout');
  const watts = el('psu-watts');
  if (readout && watts) readout.textContent = watts.value;
  updateVirtualPcSummary();
}

// ── Field "has-value" state — accent border when a field has a non-default value ──
function updateFieldValueState(fieldEl) {
  const select = fieldEl.querySelector('select');
  const input  = fieldEl.querySelector('input[type="number"]');
  let filled = false;

  if (select) {
    // Compare against the first option (default) value
    const defaultVal = select.options[0]?.value;
    filled = select.value !== defaultVal;
  } else if (input) {
    filled = input.value !== '' && input.value !== '0';
  }

  fieldEl.classList.toggle('has-value', filled);
}

function initFieldValueStates() {
  document.querySelectorAll('.field').forEach(fieldEl => {
    updateFieldValueState(fieldEl);
    const select = fieldEl.querySelector('select');
    const input  = fieldEl.querySelector('input[type="number"]');
    const target = select || input;
    if (target) {
      target.addEventListener('change', () => updateFieldValueState(fieldEl));
      target.addEventListener('input',  () => updateFieldValueState(fieldEl));
    }
  });
}

function boot() {
  setMemoryCompatibilityUpdater(updateMemoryCompatibility);
  resetInputsToDefaults();
  bindEvents();
  initWizard({
    onRerun: () => analyze(),
    onCopyResult: copyResultSummary,
    onAdjust: () => goToWizardStep(0),
  });
  initAccordion();
  initResultGuidance(scrollToUpgradeRecommendation);
  initVirtualPcMap();
  initClickableFields();
  updateMemoryCompatibility();
  updatePsuReadout();
  updateSystemTypeFields();
  updateQuickChips();
  updateBudgetPresets();
  updateVirtualPcRamMode();
  updateVirtualPcSummary();
  setVirtualPcPart('system');
  initTierBadges();
  initResultPage();
  initFieldValueStates();
  setLanguage('en');

  // ── Toggle groups — sync with hidden select ──────────────────────
  function initToggleGroups() {
    document.querySelectorAll('.tg-group').forEach(group => {
      const selectId = group.dataset.tgId;
      const select   = document.getElementById(selectId);
      if (!select) return;

      const syncActive = (val) => {
        group.querySelectorAll('.tg-btn').forEach(btn => {
          btn.classList.toggle('tg-active', btn.dataset.tgVal === val);
        });
      };

      // Başta hiçbiri seçili değil
      // syncActive(select.value); — intentionally removed

      group.addEventListener('click', e => {
        const btn = e.target.closest('.tg-btn');
        if (!btn) return;
        select.value = btn.dataset.tgVal;
        syncActive(btn.dataset.tgVal);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  initToggleGroups();

  // FOUC prevention — reveal page after boot
  requestAnimationFrame(() => document.body.classList.add('ready'));
}

function restoreFromPageCache() {
  resetInputsToDefaults();
  goToWizardStep(0, false);
  updateMemoryCompatibility();
  updatePsuReadout();
  updateSystemTypeFields();
  updateQuickChips();
  updateBudgetPresets();
  updateVirtualPcRamMode();
  updateVirtualPcSummary();
  setVirtualPcPart('system');
  setLanguage('en');
}

window.addEventListener('DOMContentLoaded', () => boot());
window.addEventListener('pageshow', event => {
  if (event.persisted) restoreFromPageCache();
});
