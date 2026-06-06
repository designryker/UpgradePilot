// ── RAM compatibility & speed dropdowns ──────────────────────────────
import { el, inTr } from './utils.js';
import { updateQuickChips } from './ui-parts.js';

export function cpuMemoryMode(cpuKey) {
  if (cpuKey.startsWith('r5_7') || cpuKey.startsWith('r7_7') || cpuKey.startsWith('r9_7') ||
      cpuKey.startsWith('r5_9') || cpuKey.startsWith('r7_9') || cpuKey.startsWith('r9_9')) return 'ddr5';
  if (cpuKey.startsWith('r3_3') || cpuKey.startsWith('r5_1') || cpuKey.startsWith('r5_2') ||
      cpuKey.startsWith('r5_3') || cpuKey.startsWith('r5_5') || cpuKey.startsWith('r7_2') ||
      cpuKey.startsWith('r7_5') || cpuKey.startsWith('r9_5')) return 'ddr4';
  if (cpuKey.startsWith('i5_6') || cpuKey.startsWith('i7_6') ||
      cpuKey.startsWith('i5_7') || cpuKey.startsWith('i7_7') ||
      cpuKey.startsWith('i5_8') || cpuKey.startsWith('i7_8') ||
      cpuKey.startsWith('i5_9') || cpuKey.startsWith('i7_9') || cpuKey.startsWith('i9_9')) return 'ddr4';
  if (cpuKey.startsWith('i5_10') || cpuKey.startsWith('i7_10') || cpuKey.startsWith('i9_10') ||
      cpuKey.startsWith('i5_11') || cpuKey.startsWith('i7_11')) return 'ddr4';
  if (cpuKey.startsWith('i3_12') || cpuKey.startsWith('i5_12') || cpuKey.startsWith('i7_12') || cpuKey.startsWith('i9_12') ||
      cpuKey.startsWith('i5_13') || cpuKey.startsWith('i7_13') || cpuKey.startsWith('i9_13') ||
      cpuKey.startsWith('i5_14') || cpuKey.startsWith('i7_14') || cpuKey.startsWith('i9_14')) return 'both';
  if (cpuKey.startsWith('ultra')) return 'ddr5';
  return 'both';
}

export function updateRamSpeeds() {
  const type = el('ram-type').value;
  const spd  = el('ram-speed');
  spd.innerHTML = '';

  const OPTS = {
    ddr4: [
      ['ddr4_2400','DDR4 2400'], ['ddr4_2666','DDR4 2666'],
      ['ddr4_3000','DDR4 3000'], ['ddr4_3200','DDR4 3200'],
      ['ddr4_3600','DDR4 3600'], ['ddr4_4000','DDR4 4000+'],
    ],
    ddr5: [
      ['ddr5_4800','DDR5 4800'], ['ddr5_5200','DDR5 5200'],
      ['ddr5_5600','DDR5 5600'], ['ddr5_6000','DDR5 6000'],
      ['ddr5_6400','DDR5 6400+'], ['ddr5_7200','DDR5 7200+'],
    ],
  };
  const DEFAULT = { ddr4: 'ddr4_3200', ddr5: 'ddr5_4800' };
  const def = DEFAULT[type] || 'ddr4_3200';

  (OPTS[type] || OPTS.ddr4).forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = t;
    if (v === def) o.selected = true;
    spd.appendChild(o);
  });
}

export function updateMemoryCompatibility() {
  const cpuKey = el('cpu').value;
  const mode   = cpuMemoryMode(cpuKey);
  const ramType = el('ram-type');
  const ddr4 = ramType.querySelector('option[value="ddr4"]');
  const ddr5 = ramType.querySelector('option[value="ddr5"]');

  ddr4.disabled = mode === 'ddr5';
  ddr5.disabled = mode === 'ddr4';
  if (mode === 'ddr4' && ramType.value !== 'ddr4') ramType.value = 'ddr4';
  if (mode === 'ddr5' && ramType.value !== 'ddr5') ramType.value = 'ddr5';

  updateRamSpeeds();

  const note = el('memory-compat-note');
  if (note) {
    note.textContent = mode === 'both'
      ? inTr('This CPU generation can commonly be found with DDR4 or DDR5 motherboards. Pick the RAM type your motherboard actually uses.',
             'Bu işlemci nesli DDR4 veya DDR5 anakartlarla kullanılabiliyor. Anakartında hangi RAM varsa onu seç.')
      : mode === 'ddr5'
        ? inTr('This CPU platform expects DDR5 memory.', 'Bu işlemci platformu DDR5 bellek kullanır.')
        : inTr('This CPU platform expects DDR4 memory.', 'Bu işlemci platformu DDR4 bellek kullanır.');
  }
  updateQuickChips();
}
