// ── Pure utility helpers ──────────────────────────────────────────────
import { currentLang } from './state.js';

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function el(id)           { return document.getElementById(id); }
export function inTr(en, tr)     { return currentLang === 'tr' ? tr : en; }

export function selectedOptionText(id) {
  const node = el(id);
  return node?.selectedOptions?.[0]?.textContent?.trim() || '';
}

export function groupLabel(g) {
  if (currentLang !== 'tr') return g;
  return ({
    'Windows': 'Windows',
    'GPU': 'GPU',
    'CPU': 'CPU',
    'Drivers': 'Suruculer',
    'Thermals': 'Sicaklik',
    'Storage': 'Depolama',
    'Retest': 'Tekrar Test',
    'Memory': 'Bellek',
    'Storage / Stutter': 'Depolama / Stutter',
    'Confirm GPU Bottleneck': 'GPU Darboğazını Doğrula',
    'Confirm CPU Bottleneck': 'CPU Darboğazını Doğrula',
    'Confirm RAM Issue': 'RAM Sorununu Doğrula',
    'PSU / Stability Check': 'PSU / Stabilite Kontrolü',
    'Warning': 'Uyarı',
    'Stutter & Frametime': 'Stutter ve Frametime',
    'General Checks': 'Genel Kontroller',
    'Cooling / Thermals': 'Soğutma / Sıcaklık',
    'Laptop Cooling': 'Laptop Soğutması',
    'Laptop Power': 'Laptop Gücü',
    'Display / Monitor': 'Ekran / Monitör',
    'Windows Version': 'Windows Sürümü',
    'Storage Upgrade': 'Depolama Yükseltmesi',
    'Cooling Validation': 'Soğutma Doğrulaması',
  })[g] || g;
}
