// ── Accordion panel management ────────────────────────────────────────
// Fixed version: delegation-only, no double-binding, no missing-element crash.
import { el } from './utils.js';

/**
 * Bind accordion toggle to the result card via event delegation.
 * Safe to call multiple times — binding is idempotent.
 */
export function initAccordion() {
  const resultCard = el('result');
  if (!resultCard) return;
  if (resultCard.dataset.accordionBound === 'true') return;
  resultCard.dataset.accordionBound = 'true';

  resultCard.addEventListener('click', event => {
    const toggle = event.target.closest('.r-sec-toggle, .rs-label-toggle, .rc-toggle');
    if (!toggle) return;
    const sec = toggle.closest('.r-sec-collapsible, .rc-accordion');
    if (!sec) return;
    sec.dataset.accordion = sec.dataset.accordion === 'open' ? 'closed' : 'open';
  });
}

/**
 * Open a specific result section by its display number (01, 02 …).
 * Called from result-guidance buttons.
 */
export function openResultSection(number) {
  const target = [...document.querySelectorAll('.r-sec-collapsible')].find(sec =>
    sec.querySelector('.r-num')?.textContent?.trim() === String(number).padStart(2, '0')
  );
  if (!target) return;
  target.dataset.accordion = 'open';
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Reset all accordion sections after a new analysis run.
 * Section 03 opens; all others close.
 */
export function resetAccordionState() {
  // rc-accordion — tümü kapalı başlar
  document.querySelectorAll('.rc-accordion').forEach(sec => {
    sec.dataset.accordion = 'closed';
  });
  // r-sec-collapsible — tümü kapalı
  document.querySelectorAll('.r-sec-collapsible').forEach(sec => {
    sec.dataset.accordion = 'closed';
  });
}

/**
 * Bind result guidance jump buttons (free-boost, upgrade-jump, free-boost-review).
 * Idempotent — safe to call on each render.
 */
export function initResultGuidance(onScrollToUpgrade) {
  const result = el('result');
  if (!result || result.dataset.guidanceBound === 'true') return;
  result.dataset.guidanceBound = 'true';

  el('result-free-boost')?.addEventListener('click', () => openResultSection(3));
  el('result-upgrade-jump')?.addEventListener('click', onScrollToUpgrade);
  el('free-boost-review')?.addEventListener('click', onScrollToUpgrade);
}

export function scrollToUpgradeRecommendation() {
  document.querySelector('.result-upgrade-section')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
