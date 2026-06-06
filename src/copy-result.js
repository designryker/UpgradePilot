// ── Copy result to clipboard ──────────────────────────────────────────
import { el, inTr } from './utils.js';
import { latestResultSummary } from './state.js';
import { I18N } from './i18n.js';
import { currentLang } from './state.js';

export function setCopyButtonState(copied) {
  const button = el('result-copy');
  if (!button) return;
  button.textContent = copied
    ? inTr('Copied', 'Kopyalandi')
    : (I18N[currentLang].copyResultBtn || inTr('Copy Result', 'Sonucu Kopyala'));
  button.classList.toggle('is-copied', copied);
}

export async function copyResultSummary() {
  if (!latestResultSummary) return;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(latestResultSummary);
    } else {
      const area = document.createElement('textarea');
      area.value = latestResultSummary;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopyButtonState(true);
    window.setTimeout(() => setCopyButtonState(false), 1600);
  } catch {
    setCopyButtonState(false);
  }
}
