// ── Budget presets & display detection ───────────────────────────────
import { el, inTr } from './utils.js';

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

export function estimatePhysicalDisplay({ width, height, devicePixelRatio = 1 }) {
  const scale = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function classifyDisplayResolution(width, height) {
  const shortEdge = Math.min(width, height);
  if (shortEdge >= 1800) return '4k';
  if (shortEdge >= 1250) return '1440';
  return '1080';
}

export function detectDisplay() {
  const cssWidth  = window.screen?.width  || window.innerWidth;
  const cssHeight = window.screen?.height || window.innerHeight;
  const { width, height } = estimatePhysicalDisplay({
    width: cssWidth,
    height: cssHeight,
    devicePixelRatio: window.devicePixelRatio,
  });
  const detected = classifyDisplayResolution(width, height);
  const res = el('res');
  if (!res) return;
  res.value = detected;
  document.querySelectorAll('[data-tg-target="res"]').forEach(button => {
    button.classList.toggle('tg-active', button.dataset.tgVal === detected);
  });
  res.dispatchEvent(new Event('change', { bubbles: true }));

  const feedback = el('display-detect-feedback');
  if (feedback) {
    const label = detected === '4k' ? '4K' : detected + 'p';
    feedback.hidden = false;
    feedback.textContent = inTr(
      `Estimated ${width} x ${height} display: ${label}. Confirm this matches your gaming resolution.`,
      `Tahmini ekran ${width} x ${height}: ${label}. Oyun cozunurlugunle eslestigini dogrula.`
    );
  }
}
