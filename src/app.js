import './styles.css';

import { setLanguage, setResultRerenderCallback } from './language.js';
import { initWizard, goToWizardStep } from './wizard.js';
import { bindEvents } from './events.js';
import { initAccordion, initResultGuidance, scrollToUpgradeRecommendation } from './accordion.js';
import { initVirtualPcMap, initClickableFields, updateQuickChips, updateVirtualPcRamMode, updateVirtualPcSummary, setVirtualPcPart, setMemoryCompatibilityUpdater } from './ui-parts.js';
import { updateMemoryCompatibility } from './memory-compat.js';
import { updateSystemTypeFields } from './system-type.js';
import { updateBudgetPresets } from './budget-display.js';
import { resetInputsToDefaults } from './reset.js';
import { analyze } from './analyze.js';
import { copyResultSummary } from './copy-result.js';
import { el } from './utils.js';

function updatePsuReadout() {
  const readout = el('psu-readout');
  const watts = el('psu-watts');
  if (readout && watts) readout.textContent = watts.value;
  updateVirtualPcSummary();
}

function boot() {
  setResultRerenderCallback(() => analyze(true));
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
  setLanguage('en');

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
