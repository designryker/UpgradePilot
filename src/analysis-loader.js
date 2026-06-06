// ── Analysis loading sequence ────────────────────────────────────────
import { el } from './utils.js';
import { getAnalysisMessages } from './recommendation-helpers.js';
import {
  currentLang,
  analysisSequenceTimer, setAnalysisSequenceTimer,
  analysisMessageTimer,  setAnalysisMessageTimer,
} from './state.js';
import { ANALYSIS_SEQUENCE_MS } from './recommendation-helpers.js';

export function clearAnalysisSequence() {
  window.clearTimeout(analysisSequenceTimer);
  window.clearInterval(analysisMessageTimer);
  setAnalysisSequenceTimer(null);
  setAnalysisMessageTimer(null);
}

export function startAnalysisSequence(onComplete) {
  clearAnalysisSequence();
  const loader      = el('loading-card');
  const messageNode = el('analysis-message');
  const progressNode = el('analysis-progress');
  const messages    = getAnalysisMessages(currentLang);
  let index = 0;

  if (loader) loader.classList.add('show', 'is-analyzing');
  if (progressNode) {
    progressNode.style.animation = 'none';
    void progressNode.offsetWidth;
    progressNode.style.animation =
      'analysisProgress ' + ANALYSIS_SEQUENCE_MS + 'ms cubic-bezier(.2,.8,.2,1) forwards,' +
      'diagnosticScan 1.1s ease-in-out infinite';
  }
  if (messageNode) messageNode.textContent = messages[index];

  const intervalMs = Math.max(320, Math.floor(ANALYSIS_SEQUENCE_MS / 5));
  setAnalysisMessageTimer(window.setInterval(() => {
    index = Math.min(index + 1, messages.length - 1);
    if (messageNode) {
      messageNode.classList.remove('is-swapping');
      void messageNode.offsetWidth;
      messageNode.textContent = messages[index];
      messageNode.classList.add('is-swapping');
    }
    if (index >= messages.length - 1) window.clearInterval(analysisMessageTimer);
  }, intervalMs));

  setAnalysisSequenceTimer(window.setTimeout(() => {
    clearAnalysisSequence();
    onComplete();
  }, ANALYSIS_SEQUENCE_MS));
}
