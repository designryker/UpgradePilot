// ── Budget presets & display detection ───────────────────────────────
import { el } from './utils.js';

export function formatBudgetPresetLabel(amount, currency) {
  if (currency === 'try') return amount >= 1000 ? (amount / 1000) + 'K TL' : amount + ' TL';
  if (currency === 'eur') return '€' + amount;
  return '$' + amount;
}

export function updateBudgetPresets() {
  const currency = el('currency')?.value || 'usd';
  const presets  = ({
    usd: [250, 500, 750, 1000, 1500],
    eur: [250, 500, 750, 1000, 1500],
    try: [10000, 20000, 35000, 50000, 75000],
  })[currency] || [250, 500, 750, 1000, 1500];

  document.querySelectorAll('[data-budget-preset]').forEach((button, index) => {
    const amount = presets[index] ?? presets[presets.length - 1];
    button.dataset.budgetPreset = String(amount);
    button.textContent = formatBudgetPresetLabel(amount, currency);
  });
}

export function setBudgetPreset(amount) {
  const budget = el('budget');
  if (budget) budget.value = amount;
}

export function detectDisplay() {
  const width    = window.screen?.width  || window.innerWidth;
  const height   = window.screen?.height || window.innerHeight;
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  const res = el('res');
  if (!res) return;
  if (longEdge >= 3500 || shortEdge >= 1900) res.value = '4k';
  else if (longEdge >= 2300 || shortEdge >= 1300) res.value = '1440';
  else res.value = '1080';
}
