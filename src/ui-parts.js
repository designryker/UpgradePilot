// ── UI helpers: virtual PC map, clickable fields, quick chips, memory ──
import { el, inTr, selectedOptionText } from './utils.js';
import { currentLang, QUICK_PARTS, hasTouchedSpecs, setHasTouchedSpecs } from './state.js';
import { buildPartSearchText } from './recommendation-helpers.js';
import { I18N } from './i18n.js';
import { CPU_TIER, GPU_TIER } from './parts-data.js';

// ── Tier badge ────────────────────────────────────────────────────────

const TIER_META = {
  'entry':     { label_en: 'Entry',      label_tr: 'Giriş',           color: '#6b7280' },
  'mid':       { label_en: 'Mid-range',  label_tr: 'Orta Seviye',     color: '#3b82f6' },
  'upper-mid': { label_en: 'Upper-mid',  label_tr: 'Orta-Üst',        color: '#8b5cf6' },
  'high-end':  { label_en: 'High-end',   label_tr: 'Üst Seviye',      color: '#f59e0b' },
  'flagship':  { label_en: 'Flagship',   label_tr: 'Amiral Gemisi',   color: '#10b981' },
};

export function updatePartTierBadge(partId) {
  const badgeWrap = document.getElementById(partId + '-tier-badge');
  if (!badgeWrap) return;
  const select = el(partId);
  if (!select) return;
  const val = select.value;
  const map = partId === 'cpu' ? CPU_TIER : GPU_TIER;
  const info = map[val];
  if (!info) { badgeWrap.hidden = true; return; }
  const meta = TIER_META[info.tier] || TIER_META['mid'];
  const lang = currentLang === 'tr' ? 'tr' : 'en';
  const tierLabel = meta['label_' + lang];
  const desc = info['desc_' + lang];
  badgeWrap.hidden = false;
  badgeWrap.innerHTML =
    '<span class="tier-dot" style="background:' + meta.color + '"></span>' +
    '<span class="tier-label" style="color:' + meta.color + '">' + tierLabel + '</span>' +
    '<span class="tier-desc">' + desc + '</span>';
}

export function initTierBadges() {
  ['cpu', 'gpu'].forEach(id => {
    const select = el(id);
    if (!select) return;
    updatePartTierBadge(id);
    select.addEventListener('change', () => {
      syncPartSearchWithSelection(id);
      updatePartTierBadge(id);
    });
  });
}

let memoryCompatibilityUpdater = null;
export function setMemoryCompatibilityUpdater(fn) { memoryCompatibilityUpdater = typeof fn === 'function' ? fn : null; }

// ── Virtual PC map ────────────────────────────────────────────────────

export function partLabel(part) {
  return ({
    cpu:    currentLang === 'tr' ? 'İşlemci odağı'      : 'CPU focus',
    gpu:    currentLang === 'tr' ? 'Ekran kartı odağı'  : 'GPU focus',
    ram:    currentLang === 'tr' ? 'Bellek odağı'       : 'Memory focus',
    psu:    currentLang === 'tr' ? 'Güç kaynağı odağı'  : 'Power focus',
    system: currentLang === 'tr' ? 'Mevcut sistem'      : 'Current rig',
  })[part] || part;
}

export function setSummaryActivePart(part) {
  const safePart = ['cpu', 'gpu', 'ram', 'psu'].includes(part) ? part : '';
  document.querySelectorAll('[data-summary-part],[data-status-part]').forEach(node => {
    const targetPart = node.dataset.summaryPart || node.dataset.statusPart;
    node.classList.toggle('is-active', !!safePart && targetPart === safePart);
  });
}

export function updateVirtualPcRamMode() {
  const visual = el('pc-visual');
  if (!visual) return;
  visual.dataset.ramMode = el('channel')?.value || 'dual';
}

export function updateVirtualPcSummary() {
  const isLaptopMode = el('system-type')?.value === 'laptop';
  const powerLabel  = el('pc-summary-power-label');
  const powerStatus = el('pc-status-power');
  if (powerLabel) powerLabel.textContent = isLaptopMode ? inTr('Power Mode', 'Guc Modu') : 'Power';
  if (powerStatus) powerStatus.textContent = isLaptopMode ? inTr('Mode', 'Mod') : 'PSU';

  if (!hasTouchedSpecs) {
    const empty = inTr('Not selected', 'Secilmedi');
    ['pc-summary-cpu', 'pc-summary-gpu', 'pc-summary-ram', 'pc-summary-power'].forEach(id => {
      const n = el(id); if (n) n.textContent = empty;
    });
    return;
  }

  const cpu   = selectedOptionText('cpu') || 'CPU';
  const gpu   = selectedOptionText('gpu') || 'GPU';
  const ram   = (selectedOptionText('ram') || 'RAM') + ' ' + (selectedOptionText('ram-type') || '');
  const speed = selectedOptionText('ram-speed');
  const channel = selectedOptionText('channel');
  const power = isLaptopMode
    ? inTr('Charger / power mode', 'Adaptor / guc modu')
    : (el('psu-watts')?.value || '650') + 'W PSU';

  const cpuNode   = el('pc-summary-cpu');
  const gpuNode   = el('pc-summary-gpu');
  const ramNode   = el('pc-summary-ram');
  const powerNode = el('pc-summary-power');
  if (cpuNode)   cpuNode.textContent   = cpu.replace(/^Intel /, '');
  if (gpuNode)   gpuNode.textContent   = gpu;
  if (ramNode)   ramNode.textContent   = ram + (speed ? ' / ' + speed.replace(/^DDR[45]\s*/, '') : '') + (channel ? ' / ' + channel : '');
  if (powerNode) powerNode.textContent = power;
}

export function setVirtualPcPart(part, label) {
  const visual = el('pc-visual');
  if (!visual) return;
  const safePart = ['cpu', 'gpu', 'ram', 'psu', 'system'].includes(part) ? part : 'system';
  visual.dataset.activePart = safePart;
  setSummaryActivePart(safePart);
  updateVirtualPcRamMode();
  updateVirtualPcSummary();
  const labelNode = el('pc-visual-label');
  if (labelNode) labelNode.textContent = label || partLabel(safePart);
}

function wirePartTarget(node, part, label) {
  if (!node || node.dataset.pcMapBound === 'true') return;
  node.dataset.pcMapBound = 'true';
  const activate = () => setVirtualPcPart(part, label || partLabel(part));
  // Keep the Virtual PC neon state click-driven. Hover used to auto-light
  // parts and made the UI feel jumpy, especially on the result/form page.
  node.addEventListener('click', activate);
}

export function initVirtualPcMap() {
  document.querySelectorAll('[data-pc-part]').forEach(node => {
    wirePartTarget(node, node.dataset.pcPart, node.dataset.pcLabel || partLabel(node.dataset.pcPart));
  });
  document.querySelectorAll('[data-summary-part]').forEach(node => {
    wirePartTarget(node, node.dataset.summaryPart, node.dataset.pcLabel || partLabel(node.dataset.summaryPart));
  });
  document.querySelectorAll('.pc-part[data-part]').forEach(node => {
    wirePartTarget(node, node.dataset.part, node.dataset.pcLabel || partLabel(node.dataset.part));
  });
}

// ── Clickable fields ─────────────────────────────────────────────────

export function initClickableFields() {
  document.querySelectorAll('.field').forEach(field => {
    if (field.dataset.fieldBound === 'true') return;
    const control = field.querySelector('select, input[type="range"], input[type="number"], input[type="text"], input[type="search"], textarea');
    if (!control) return;
    field.dataset.fieldBound = 'true';
    field.classList.add('is-clickable-field');

    // Track native select dropdown open state
    // mousedown opens it, change/blur/click-outside closes it
    if (control.tagName === 'SELECT') {
      control._dropdownOpen = false;
      control.addEventListener('mousedown', () => {
        control._dropdownOpen = !control._dropdownOpen;
      });
      control.addEventListener('change', () => {
        control._dropdownOpen = false;
      });
      control.addEventListener('blur', () => {
        control._dropdownOpen = false;
      });
      // Escape key closes dropdown
      control.addEventListener('keydown', e => {
        if (e.key === 'Escape' || e.key === 'Enter') control._dropdownOpen = false;
      });
    }

    if (control.tagName === 'SELECT' && !field.querySelector('.field-click-cue')) {
      const cue = document.createElement('span');
      cue.className   = 'field-click-cue';
      cue.dataset.i18n = 'clickToChange';
      cue.textContent = I18N[currentLang].clickToChange || inTr('Click to edit', 'Tikla degistir');
      field.prepend(cue);
    }

    const setHover  = on => field.classList.toggle('is-field-hover', on);
    const setActive = on => field.classList.toggle('is-field-active', on);
    const flashActive = () => {
      setActive(true);
      window.clearTimeout(field._activeTimer);
      field._activeTimer = window.setTimeout(() => {
        if (!field.contains(document.activeElement)) setActive(false);
      }, 180);
    };

    // Do not turn on the neon state on hover; only focus/click/input should do it.
    field.addEventListener('mouseleave', () => {
      if (control.tagName === 'SELECT') return; // SELECT dropdown yönetir
      setHover(false);
      if (!field.contains(document.activeElement)) setActive(false);
    });
    field.addEventListener('focusin',  () => { setActive(true); });
    field.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (control.tagName === 'SELECT') return; // SELECT kendi blur'unu yönetir
        if (!field.contains(document.activeElement) && !field.matches(':hover')) {
          setHover(false); setActive(false);
        }
      }, 40);
    });
    control.addEventListener('change', flashActive);
    control.addEventListener('input',  flashActive);

    field.addEventListener('click', event => {
      if (event.target.closest('button,a,.field-help,.inline-tools')) return;
      if (event.target.type === 'checkbox' || event.target.type === 'radio') return;
      if (event.target.tagName === 'LABEL' && event.target.htmlFor) return;
      // CPU/GPU fields contain both a search input and a native select.
      // If the click lands on the select, never bounce focus back to the
      // search input — that was closing the native dropdown immediately.
      if (event.target.closest('select')) { flashActive(); return; }
      // SELECT-only fields manage their own native dropdown.
      if (control.tagName === 'SELECT') { flashActive(); return; }
      if (event.target === control) { flashActive(); return; }
      const selection = window.getSelection?.();
      if (selection && selection.toString()) return;
      control.focus({ preventScroll: true });
      flashActive();
      if (control.type === 'checkbox' || control.type === 'radio') {
        control.click();
      }
    });
  });
}

// ── Quick chips ───────────────────────────────────────────────────────

export function renderQuickChipsForMode() {
  const mode = el('system-type')?.value === 'laptop' ? 'laptop' : 'desktop';
  ['cpu', 'gpu'].forEach(id => {
    const grid = el(id + '-popular');
    if (!grid) return;
    grid.innerHTML = QUICK_PARTS[mode][id].map(([value, label]) =>
      '<button type="button" class="quick-chip" data-quick-pick="' + id + '" data-value="' + value + '">' + label + '</button>'
    ).join('');
  });
}

export function updateQuickChips() {
  ['cpu', 'gpu'].forEach(id => {
    const val = el(id).value;
    document.querySelectorAll('#' + id + '-popular .quick-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.value === val);
    });
  });
}

// ── Part select helpers ───────────────────────────────────────────────

function isOptionAvailableForCurrentMode(option) {
  if (!option) return false;
  const mode      = el('system-type')?.value === 'laptop' ? 'laptop' : 'desktop';
  const groupMode = option.closest('optgroup')?.dataset.systemMode || 'desktop';
  return groupMode === mode && !option.disabled && !option.hidden;
}

function firstAvailablePartOption(select) {
  return [...select.options].find(option => isOptionAvailableForCurrentMode(option));
}

export function applySystemModeToPartSelects(selectId) {
  const mode = el('system-type')?.value === 'laptop' ? 'laptop' : 'desktop';
  const ids  = selectId ? [selectId] : ['cpu', 'gpu'];
  ids.forEach(id => {
    const select = el(id);
    if (!select) return;
    select.querySelectorAll('optgroup').forEach(group => {
      const hidden = (group.dataset.systemMode || 'desktop') !== mode;
      group.hidden   = hidden;
      group.disabled = hidden;
      group.querySelectorAll('option').forEach(o => { o.hidden = hidden; o.disabled = hidden; });
    });
    if (!isOptionAvailableForCurrentMode(select.selectedOptions?.[0])) {
      const fallback = firstAvailablePartOption(select);
      if (fallback) select.value = fallback.value;
    }
  });
}


export function syncPartSearchWithSelection(selectId) {
  const select = el(selectId);
  const search = el(selectId + '-search');
  if (!select || !search) return;
  const selected = select.selectedOptions?.[0];
  const value = select.value;
  const label = selected?.textContent?.trim() || '';
  search.value = value ? label : '';
  applySystemModeToPartSelects(selectId);
  updateQuickChips();
  updatePartTierBadge(selectId);
}

export function filterSelectOptions(selectId, query) {
  const select = el(selectId);
  if (!select) return;

  // Native dropdown açıkken DOM'a dokunma — dropdown kapanır
  if (select._dropdownOpen) return;

  const q  = query.trim().toLowerCase();
  const nq = q.replace(/[^a-z0-9]/g, '');
  if (q) applySystemModeToPartSelects(selectId);
  let firstMatch = null;

  select.querySelectorAll('option').forEach(option => {
    const mode      = el('system-type')?.value === 'laptop' ? 'laptop' : 'desktop';
    const groupMode = option.closest('optgroup')?.dataset.systemMode || 'desktop';
    const modeMatch = groupMode === mode;
    const label     = option.textContent.toLowerCase();
    const normalized = buildPartSearchText(selectId, option.value, option.textContent);
    const isSearchMatch = !q || label.includes(q) || normalized.includes(nq);
    const isMatch       = modeMatch && isSearchMatch;
    option.hidden   = !modeMatch;
    // Only set disabled when there's an active query — avoid touching DOM
    // while native dropdown is open (causes dropdown to close)
    if (q) option.disabled = !isMatch;
    else   option.disabled = false;
    if (isMatch && !firstMatch) firstMatch = option;
  });

  select.querySelectorAll('optgroup').forEach(group => {
    const mode      = el('system-type')?.value === 'laptop' ? 'laptop' : 'desktop';
    const groupMode = group.dataset.systemMode || 'desktop';
    const modeMatch = groupMode === mode;
    const hasMatch  = [...group.querySelectorAll('option')].some(o => !o.disabled);
    group.hidden   = !modeMatch;
    if (q) group.disabled = !modeMatch || !hasMatch;
    else   group.disabled = !modeMatch;
  });

  if (q && firstMatch) {
    select.value = firstMatch.value;
    if (selectId === 'cpu') memoryCompatibilityUpdater?.();
    updateQuickChips();
    updatePartTierBadge(selectId);
  }
}

export function quickPick(selectId, value) {
  setHasTouchedSpecs(true);
  const node = el(selectId);
  if (node) node.value = value;
  setVirtualPcPart(selectId === 'gpu' ? 'gpu' : 'cpu',
                   selectId === 'gpu' ? 'GPU focus' : 'CPU focus');
  syncPartSearchWithSelection(selectId);
  if (selectId === 'cpu') memoryCompatibilityUpdater?.();
  updateQuickChips();
  updatePartTierBadge(selectId);
}
