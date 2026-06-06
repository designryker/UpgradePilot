// ── Language switching ────────────────────────────────────────────────
import { el, inTr } from './utils.js';
import { currentLang, setCurrentLang } from './state.js';
import { I18N } from './i18n.js';
import { updateSystemTypeFields } from './system-type.js';
import { renderWizardProgress } from './wizard.js';

let rerenderVisibleResult = null;
export function setResultRerenderCallback(fn) { rerenderVisibleResult = typeof fn === 'function' ? fn : null; }

export function setLanguage(lang) {
  setCurrentLang(lang === 'tr' ? 'tr' : 'en');
  document.documentElement.lang = currentLang;
  document.title = I18N[currentLang].title;

  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    if (I18N[currentLang][key] !== undefined) node.textContent = I18N[currentLang][key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(node => {
    const key = node.getAttribute('data-i18n-html');
    if (I18N[currentLang][key] !== undefined) node.innerHTML = I18N[currentLang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    const key = node.getAttribute('data-i18n-placeholder');
    if (I18N[currentLang][key] !== undefined) node.setAttribute('placeholder', I18N[currentLang][key]);
  });

  const langSelect = el('lang');
  if (langSelect) langSelect.value = currentLang;

  updateSystemTypeFields();
  renderWizardProgress();

  // Re-render results in the new language if already visible
  if (el('result')?.classList.contains('show')) {
    rerenderVisibleResult?.();
  }
}
