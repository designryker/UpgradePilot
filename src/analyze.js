// ── Main analyze function ─────────────────────────────────────────────
// All score logic lives here. Render helpers are nested inside analyze()
// so they close over computed variables — preserving original behaviour.

import { CPU_SCORE, GPU_SCORE, GPU_ENC, PRICE_TR, PRICE_USD, psuMaxGpu, ramSpeedTier } from './parts-data.js';
import { I18N } from './i18n.js';
import { getBiosRecommendation, getCurrentGpuRecommendations } from './recommendation-helpers.js';
import { el, inTr, clamp, groupLabel, safeEl, showAnalysisError } from './utils.js';
import { currentLang, setLatestResultSummary } from './state.js';
import { WIZARD_STEPS, goToWizardStep } from './wizard.js';
import { clearAnalysisSequence, startAnalysisSequence } from './analysis-loader.js';
import { setVirtualPcPart } from './ui-parts.js';
import { updateFreeBoostProgress } from './free-boost.js';
import { resetAccordionState } from './accordion.js';
import { setCopyButtonState } from './copy-result.js';
import { showResultPage } from './result-page.js';
import { renderResultArtwork } from './result-artwork.js';

export function analyze(skipLoading) {
  try {
    _analyze(skipLoading);
  } catch (err) {
    console.error('[UpgradePilot] analyze() threw an unhandled error:', err);
    clearAnalysisSequence();
    showAnalysisError(
      'Something went wrong during analysis. Please refresh and try again.'
    );
  }
}

function clearInputValidation() {
  document.querySelectorAll('.field.has-validation-error').forEach(field => {
    field.classList.remove('has-validation-error');
    field.querySelector('.field-validation-message')?.remove();
  });
  document.querySelectorAll('[aria-invalid="true"]').forEach(control => control.removeAttribute('aria-invalid'));
}

function showInputValidation(control, message) {
  clearAnalysisSequence();
  el('loading-card')?.classList.remove('show', 'is-analyzing');
  el('result')?.classList.remove('show');
  goToWizardStep(1);
  clearInputValidation();

  const field = control.closest('.field');
  if (field) {
    field.classList.add('has-validation-error');
    const validationMessage = document.createElement('div');
    validationMessage.className = 'field-validation-message';
    validationMessage.textContent = message;
    field.appendChild(validationMessage);
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  control.setAttribute('aria-invalid', 'true');
  control.focus({ preventScroll: true });
  control.addEventListener('change', clearInputValidation, { once: true });
}

function _analyze(skipLoading) {
  // ── Read inputs — guard all element accesses ──
  const cpuEl = safeEl('cpu');
  const gpuEl = safeEl('gpu');
  const ramEl = safeEl('ram');
  const resEl = safeEl('res');
  const hzEl  = safeEl('hz');

  if (!cpuEl || !gpuEl || !ramEl || !resEl || !hzEl) {
    showAnalysisError('Required form elements are missing. Please refresh the page.');
    return;
  }

  // ── Placeholder / empty selection guard ──
  clearInputValidation();
  if (!cpuEl.value) {
    showInputValidation(cpuEl, 'Please select your CPU before running the analysis.');
    return;
  }
  if (!gpuEl.value) {
    showInputValidation(gpuEl, 'Please select your GPU before running the analysis.');
    return;
  }
  if (!ramEl.value) {
    showInputValidation(ramEl, 'Please select your RAM capacity before running the analysis.');
    return;
  }

  if (!skipLoading) {
    const loader = el('loading-card');
    const result = el('result');
    if (result) result.classList.remove('show');
    if (loader) loader.classList.remove('show');
    goToWizardStep(WIZARD_STEPS.length - 2, false);
    startAnalysisSequence(() => analyze(true));
    return;
  }
  clearAnalysisSequence();
  const loader = el('loading-card');
  if (loader) loader.classList.remove('show', 'is-analyzing');

  const cpuKey   = cpuEl.value;
  const gpuKey   = gpuEl.value;
  const ramGB    = parseInt(ramEl.value);
  const ramType  = el('ram-type')?.value  || 'ddr4';
  const ramSpVal = el('ram-speed')?.value || 'unknown';
  const channel  = el('channel')?.value   || 'dual';
  const psuW     = el('psu-unknown-check')?.checked ? 0 : (parseInt(el('psu-watts')?.value) || 0);
  const psuEff   = el('psu-eff')?.value   || 'unknown';
  const systemType = el('system-type')?.value  || 'desktop';
  const cpuCooler  = el('cpu-cooler')?.value   || 'unknown';
  const gameDrive  = el('game-drive')?.value   || 'unknown';
  const osVersion  = el('os-version')?.value   || 'win11';
  const res      = resEl.value;
  const hz       = parseInt(hzEl.value) || 60;
  const game     = el('game')?.value     || 'mixed';
  const goal     = el('goal')?.value     || 'fps';
  const budgetN  = parseFloat(el('budget')?.value) || 0;
  const currency = el('currency')?.value || 'usd';

  // ── Validate score lookups — unknown keys produce NaN everywhere ──
  const cpuSc = CPU_SCORE[cpuKey];
  const gpuSc = GPU_SCORE[gpuKey];

  if (cpuSc === undefined) {
    showAnalysisError(
      'Unrecognized CPU selected (' + cpuKey + '). ' +
      'Please choose a CPU from the dropdown list.'
    );
    return;
  }
  if (gpuSc === undefined) {
    showAnalysisError(
      'Unrecognized GPU selected (' + gpuKey + '). ' +
      'Please choose a GPU from the dropdown list.'
    );
    return;
  }
  const USD_TRY_ROUGH_RATE = 45.93;
  const TRY_RETAIL_BUFFER = 1.28;
  const TRY_VALUE_BUFFER = 0.92;
  const TRY_USED_FACTOR = 0.72;
  const fmtTry = value => Math.round(value / 100) * 100;

  const enc       = GPU_ENC[gpuKey];
  const ramSpd    = ramSpeedTier(ramSpVal);  // 0 to 3
  const hiHz      = hz >= 144;
  const vHiHz     = hz >= 165;
  const is4k      = res === '4k';
  const is1440    = res === '1440';
  const is1080    = res === '1080';
  const cpuGpuGap = gpuSc - cpuSc;
  const isLaptop   = systemType === 'laptop';
  const weakCooler = cpuCooler === 'stock' || cpuCooler === 'basic_air' || cpuCooler === 'aio_120';
  const unknownCooler = cpuCooler === 'unknown';
  const strongCpu  = cpuSc >= 8;
  const hddGameDrive = gameDrive === 'hdd';
  const isModernIntelHybrid = cpuKey.startsWith('i5_12') || cpuKey.startsWith('i5_13') || cpuKey.startsWith('i5_14') || cpuKey.startsWith('i7_12') || cpuKey.startsWith('i7_13') || cpuKey.startsWith('i7_14') || cpuKey.startsWith('i9_12') || cpuKey.startsWith('i9_13') || cpuKey.startsWith('i9_14') || cpuKey.startsWith('ultra');
  const oldIntelPlatform =
    cpuKey.startsWith('i5_6') || cpuKey.startsWith('i7_6') ||
    cpuKey.startsWith('i5_7') || cpuKey.startsWith('i7_7') ||
    cpuKey.startsWith('i5_8') || cpuKey.startsWith('i7_8') ||
    cpuKey.startsWith('i5_9') || cpuKey.startsWith('i7_9') || cpuKey.startsWith('i9_9');
  const oldAm4Platform =
    cpuKey.startsWith('r5_1') || cpuKey.startsWith('r5_2') ||
    cpuKey.startsWith('r5_3') || cpuKey.startsWith('r7_2') || cpuKey.startsWith('r7_3');

  // ── PSU readiness ──
  const psuMaxNow    = psuMaxGpu(psuW);
  const psuDanger    = !isLaptop && psuW > 0 && gpuSc > psuMaxNow;
  const nextGpuSc    = Math.min(10, gpuSc + 2);
  const psuBlockUpgr = !isLaptop && psuW > 0 && nextGpuSc > psuMaxNow;

  // ── RAM configuration flags ──
  // channel is always 'dual' or 'single' — no unknown option
  const isSingleCh = channel === 'single';

  // ── RAM config penalty ──
  // Reflects how much free-fix RAM issues are likely dragging performance
  let ramConfigPenalty = 0;
  if (isSingleCh) ramConfigPenalty += 4;  // 50% bandwidth loss — critical fix required

  function formatGainRange(low, high) {
    return '+' + low + '% to +' + high + '%';
  }

  function estimatedGainForUpgrade() {
    if (best.score <= 1 || singleChannelPreBuyBlocker || (isLaptop && (best.key === 'gpu' || best.key === 'cpu' || best.key === 'psu'))) {
      return {
        label: formatGainRange(0, 5),
        cls: 'c-mid',
        note: inTr('Rough estimate: no paid part is likely to deliver a clean gain before the blocker is fixed.', 'Yaklasik tahmin: blokaj cozulmeden ucretli bir parcanin temiz kazanc vermesi beklenmez.')
      };
    }
    if (psuDependencyActive) {
      return {
        label: formatGainRange(0, 5),
        cls: 'c-mid',
        note: inTr('Do not count GPU gains yet. Resolve PSU readiness first, then rerun the estimate.', 'GPU kazancını henüz hesaba katma. Önce PSU hazırlığını çöz, sonra tahmini tekrar çalıştır.')
      };
    }
    if (psuW === 0 && (best.key === 'gpu' || best.key === 'psu' || psuBlockUpgr)) {
      return {
        label: formatGainRange(0, 8),
        cls: 'c-mid',
        note: inTr('Confidence-limited estimate: enter PSU wattage before trusting a GPU upgrade range.', 'Güveni sınırlı tahmin: GPU yükseltme aralığına güvenmeden önce PSU watt değerini gir.')
      };
    }
    if (unknownCooler && (best.key === 'cpu' || best.key === 'gpu')) {
      return {
        label: formatGainRange(0, 8),
        cls: 'c-mid',
        note: inTr('Confidence-limited estimate: check temperatures first because throttling can hide the real gain.', 'Güveni sınırlı tahmin: önce sıcaklıkları kontrol et; hız düşürme gerçek kazancı saklayabilir.')
      };
    }
    if (best.key === 'gpu') {
      // Estimate the impact of moving from the current GPU class to a sensible target class.
      // The old logic capped even huge GPU jumps at +18% to +35%, which made upgrades like
      // GTX 1060 -> high 1440p GPU look unrealistically weak.
      let target = res === '4k' ? 9 : res === '1440' ? 8 : hz >= 165 ? 7 : 6;
      if (budgetUSD >= 680) target = Math.max(target, 9);
      else if (budgetUSD >= 420) target = Math.max(target, 8);
      else if (budgetUSD >= 200) target = Math.max(target, 6);
      if (goal === 'visuals' || goal === 'future') target = Math.min(10, target + 1);

      const gap = Math.max(1, target - gpuSc);
      let low, high;
      if (gap >= 6)      { low = 150; high = 280; }
      else if (gap === 5) { low = 120; high = 220; }
      else if (gap === 4) { low = 90;  high = 170; }
      else if (gap === 3) { low = 60;  high = 120; }
      else if (gap === 2) { low = 35;  high = 70;  }
      else                { low = 15;  high = 35;  }

      // CPU-heavy sims/high-refresh targets can limit average FPS scaling, especially on older CPUs.
      if ((game === 'sim' || game === 'racing' || hiHz) && cpuSc <= 4 && gap >= 4) {
        low = Math.max(45, Math.round(low * 0.75));
        high = Math.max(90, Math.round(high * 0.8));
      }

      const massive = gap >= 4;
      return {
        label: formatGainRange(low, high),
        cls: massive || gap >= 3 ? 'c-hi' : 'c-mid',
        note: inTr(
          'Potential gaming uplift versus the current GPU class. CPU-heavy games, settings, and the exact GPU choice can move this range.',
          'Mevcut GPU sınıfına göre potansiyel oyun kazanımı. CPU ağırlıklı oyunlar, ayarlar ve seçilecek GPU bu aralığı değiştirebilir.'
        )
      };
    }
    if (best.key === 'cpu') {
      let target = (game === 'compfps' || game === 'sim' || goal === 'latency' || hz >= 165) ? 9 : 8;
      if (budgetUSD >= 500) target = Math.max(target, 9);
      const gap = Math.max(1, target - cpuSc);
      let low, high;
      if (gap >= 5)      { low = 60; high = 130; }
      else if (gap === 4) { low = 45; high = 95;  }
      else if (gap === 3) { low = 30; high = 70;  }
      else if (gap === 2) { low = 15; high = 40;  }
      else                { low = 5;  high = 20;  }
      return {
        label: formatGainRange(low, high),
        cls: gap >= 3 ? 'c-hi' : 'c-mid',
        note: inTr(
          'Mostly affects CPU-limited games, high-Hz targets, frame pacing, and 1% lows; average FPS may scale less in GPU-limited games.',
          'Daha çok CPU sınırlı oyunları, yüksek Hz hedefini, frame pacing ve 1% low değerlerini etkiler; GPU sınırlı oyunlarda ortalama FPS daha az artabilir.'
        )
      };
    }
    if (best.key === 'ramcap') {
      const large = ramGB <= 8 && (goal === 'smooth' || game === 'aaa' || game === 'modded' || game === 'mmorpg');
      return {
        label: large ? formatGainRange(18, 35) : ramGB <= 8 ? formatGainRange(8, 18) : formatGainRange(3, 8),
        cls: large || ramGB <= 8 ? 'c-hi' : 'c-mid',
        note: inTr('Mostly improves stutter, hitching, loading, and 1% lows rather than pure average FPS.', 'Saf ortalama FPS yerine daha cok takilma, yukleme ve 1% low tarafini iyilestirir.')
      };
    }
    if (best.key === 'ramspd') {
      return {
        label: formatGainRange(3, 8),
        cls: 'c-mid',
        note: inTr('Most visible in CPU-sensitive games after confirming XMP/EXPO is already enabled.', 'En cok CPU hassas oyunlarda ve XMP/EXPO zaten aciksa gorunur.')
      };
    }
    if (best.key === 'psu') {
      return {
        label: formatGainRange(0, 3),
        cls: 'c-mid',
        note: inTr('A PSU upgrade is mainly for stability and safety, not direct FPS.', 'PSU yukseltmesi dogrudan FPS icin degil, stabilite ve guvenlik icindir.')
      };
    }
    return {
      label: formatGainRange(0, 5),
      cls: 'c-mid',
      note: inTr('Optimize first, then rerun the analysis for a cleaner estimate.', 'Önce optimize et, sonra daha temiz tahmin için analizi tekrar çalıştır.')
    };
  }

  function estimatedThrottleLoss() {
    if (strongCpu && weakCooler) {
      return {
        show: true,
        label: '8-22%',
        cls: 'c-mid',
        note: inTr('Possible boost loss if the CPU cooler cannot hold sustained clocks.', 'Sogutucu islemcinin boost hizini koruyamazsa olasi kayip.')
      };
    }
    if (strongCpu && unknownCooler) {
      return {
        show: true,
        label: '5-18%',
        cls: 'c-mid',
        note: inTr('Cooling is unknown; verify CPU temperature and effective clocks.', 'Sogutma bilinmiyor; CPU sicakligini ve efektif frekansi dogrula.')
      };
    }
    if ((cpuSc >= 6 && weakCooler) || (gpuSc >= 7 && systemType === 'desktop')) {
      return {
        show: true,
        label: '3-12%',
        cls: 'c-mid',
        note: inTr('Possible loss from airflow, fan curve, dust, or thermal throttling.', 'Hava akisi, fan egrisi, toz veya thermal throttling kaynakli olasi kayip.')
      };
    }
    return {
      show: false,
      label: '0-5%',
      cls: 'c-mid',
      note: inTr('No clear thermal risk from the selected inputs.', 'Secilen bilgilere gore net sicaklik riski yok.')
    };
  }

  /* ============================================================
     PRIORITY SCORES (0-10 each)
     Higher = more urgent/valuable to upgrade
     ============================================================ */
  let gpuP=0, cpuP=0, ramCapP=0, ramSpdP=0, psuP=0;

  // ═══ GPU ═══════════════════════════════════════════════════════
  if (is4k) {
    if (gpuSc < 8)       gpuP += 5;
    else if (gpuSc < 10) gpuP += 2;
  }
  if (is1440) {
    if (gpuSc < 6)       gpuP += 4;
    else if (gpuSc < 8)  gpuP += 2;
  }
  if (is1080 && gpuSc < 5) gpuP += 2;

  if (game === 'aaa' || game === 'racing') {
    if (gpuSc < 7)       gpuP += 3;
    else if (gpuSc < 9)  gpuP += 1;
  }
  if (game === 'battle') {
    if (gpuSc < 6)       gpuP += 2;
    else if (gpuSc < 8)  gpuP += 1;
  }
  if (game === 'modded' && gpuSc < 7) gpuP += 2;

  if (goal === 'visuals' && gpuSc < 9)          gpuP += 2;
  if (goal === 'future'  && gpuSc < 8)          gpuP += 2;
  if (goal === 'fps' && !is1080 && gpuSc < 8)   gpuP += 1;
  if (hiHz && !is1080 && gpuSc < 7)             gpuP += 2;

  if (gpuSc >= 9)            gpuP = Math.max(0, gpuP - 5);
  if (gpuSc >= 8 && is1080)  gpuP = Math.max(0, gpuP - 3);

  // ═══ CPU ═══════════════════════════════════════════════════════
  if (is1080 && hiHz) {
    if (cpuSc < 7)       cpuP += 4;
    else if (cpuSc < 9)  cpuP += 1;
  }
  if (game === 'compfps') {
    if (cpuSc < 6)       cpuP += 4;
    else if (cpuSc < 8)  cpuP += 2;
  }
  if (game === 'mmorpg' || game === 'sim') {
    if (cpuSc < 7)       cpuP += 3;
    else if (cpuSc < 9)  cpuP += 1;
  }
  if (game === 'stream' || goal === 'stream') {
    if (cpuSc < 7)       cpuP += 4;
    else if (cpuSc < 9)  cpuP += 1;
    if (enc < 2)         cpuP += 2;
  }
  if (game === 'battle'  && cpuSc < 6) cpuP += 2;
  if (game === 'racing'  && cpuSc < 6) cpuP += 1;

  if (cpuGpuGap >= 5)       cpuP += 5;
  else if (cpuGpuGap >= 3)  cpuP += 3;
  else if (cpuGpuGap >= 2)  cpuP += 1;

  if (goal === 'fps'     && is1080 && cpuSc < 9) cpuP += 3;
  if (goal === 'latency' && cpuSc < 7)           cpuP += 2;
  if (goal === 'stream'  && cpuSc < 7)           cpuP += 2;

  // Rule: strong CPU — don't recommend unless chasing extreme 1080p FPS
  const extremeFps = (is1080 && vHiHz && (goal === 'fps' || goal === 'latency'));
  if (cpuSc >= 8 && !extremeFps) cpuP = 0;
  if (cpuSc >= 10) cpuP = 0;

  // ═══ RAM CAPACITY ══════════════════════════════════════════════
  // Rule: 8 GB = critically low, top priority
  if (ramGB === 8) {
    ramCapP = 10;
  } else if (ramGB === 16) {
    // Rule: 16 GB = medium for heavy workloads
    if (game === 'stream')            ramCapP += 4;
    else if (game === 'mmorpg')       ramCapP += 3;
    else if (game === 'modded')       ramCapP += 3;
    else if (game === 'aaa')          ramCapP += 2;
    else if (game === 'sim')          ramCapP += 2;
    if (goal === 'smooth')            ramCapP += 1;
    if (goal === 'stream')            ramCapP += 1;
  } else {
    // Rule: 32 GB+ = no capacity upgrade needed
    ramCapP = 0;
  }

  // ═══ RAM SPEED ═════════════════════════════════════════════════
  // If single-channel: don't score speed separately — fix channel mode first
  if (isSingleCh) {
    ramSpdP = 0;
  } else {
    // Speed is known and dual/unknown-channel — score normally
    if (is1080 && hiHz && ramSpd === 0)              ramSpdP += 3;
    if (game === 'compfps' || goal === 'latency') {
      if (ramSpd === 0)                              ramSpdP += 3;
      else if (ramSpd === 1 && (goal === 'fps' || goal === 'latency')) ramSpdP += 1;
    }
    if (ramSpd === 0 && cpuSc >= 6)                  ramSpdP += 2;
    if (ramSpd >= 2)                                  ramSpdP = 0;
  }

  // ═══ PSU ═══════════════════════════════════════════════════════
  if (psuDanger && psuW > 0) {
    psuP = 10;
  } else if (psuBlockUpgr && gpuP >= 4) {
    psuP = 8;
  } else if (psuBlockUpgr && gpuP >= 2) {
    psuP = 3;
  }

  // ═══ SECONDARY GOAL MODIFIERS ══════════════════════════════════
  if (goal === 'smooth') {
    ramCapP = Math.min(10, ramCapP + 1);
    ramSpdP = Math.min(10, ramSpdP + 1);
  }
  if (goal === 'fps') {
    cpuP = Math.min(10, cpuP + 1);
    ramSpdP = Math.min(10, ramSpdP + 1);
  }
  if (goal === 'future') {
    if (gpuSc < 8) gpuP = Math.min(10, gpuP + 2);
    if (cpuSc < 7) cpuP = Math.min(10, cpuP + 1);
  }
  if (goal === 'cheap') {
    gpuP  = Math.max(0, gpuP  - 3);
    cpuP  = Math.max(0, cpuP  - 2);
    if (ramGB === 8) ramCapP = Math.min(10, ramCapP + 2);
  }

  // ═══ DEVICE-TYPE GUARDRAILS ════════════════════════════════════
  // Laptops generally cannot receive practical CPU/GPU/PSU upgrades.
  // Keep the advice focused on thermals, RAM, storage, and validation.
  if (isLaptop) {
    gpuP = Math.min(gpuP, 2);
    cpuP = Math.min(cpuP, 2);
    psuP = 0;
  }

  // If 16GB+ RAM is only running single-channel, do not recommend paid parts yet.
  // The first action should be verifying/fixing dual-channel placement for free.
  const singleChannelPreBuyBlocker = isSingleCh && ramGB >= 16 && !psuDanger;

  // ═══ BUDGET GATING ═════════════════════════════════════════════
  let budgetUSD = budgetN;
  if (currency === 'eur') budgetUSD = budgetN * 1.08;
  if (currency === 'try') budgetUSD = budgetN / (USD_TRY_ROUGH_RATE * TRY_VALUE_BUFFER);

  if (budgetN > 0 && budgetUSD < 150) {
    gpuP = Math.max(0, gpuP - 5);
    cpuP = Math.max(0, cpuP - 4);
  } else if (budgetN > 0 && budgetUSD < 300) {
    gpuP = Math.max(0, gpuP - 2);
    cpuP = Math.max(0, cpuP - 1);
  }

  // Clamp all scores 0-10
  gpuP    = clamp(gpuP,    0, 10);
  cpuP    = clamp(cpuP,    0, 10);
  ramCapP = clamp(ramCapP, 0, 10);
  ramSpdP = clamp(ramSpdP, 0, 10);
  psuP    = clamp(psuP,    0, 10);

  /* ============================================================
     PICK BEST UPGRADE
     ============================================================ */
  const candidates = [
    {key:'psu',    score:psuP},
    {key:'gpu',    score:gpuP},
    {key:'cpu',    score:cpuP},
    {key:'ramcap', score:ramCapP},
    {key:'ramspd', score:ramSpdP},
  ];
  candidates.sort((a,b) => b.score - a.score);
  let best = candidates[0];
  if (singleChannelPreBuyBlocker) {
    best = {key:'none', score:0};
  }
  const psuDependencyActive = !isLaptop && (
    psuDanger ||
    best.key === 'psu' ||
    (best.key === 'gpu' && psuW > 0 && psuBlockUpgr)
  );
  const psuDependencyAction = psuW > 0
    ? inTr('Resolve PSU readiness before buying a stronger GPU.', 'Daha guclu GPU almadan once PSU hazirligini coz.')
    : inTr('Enter PSU wattage and verify PSU quality before choosing a stronger GPU.', 'Daha güçlü GPU seçmeden önce PSU watt değerini gir ve PSU kalitesini doğrula.');

  // ── Do Not Upgrade list ──
  const dnuSet = new Set();
  candidates.forEach(c => { if (c.score <= 1) dnuSet.add(c.key); });
  if (ramGB  >= 32)                             dnuSet.add('ramcap');
  if (ramSpd >= 2 && !isSingleCh) dnuSet.add('ramspd');
  if (cpuSc  >= 9)                             dnuSet.add('cpu');
  if (gpuSc  >= 9 && !is4k)                   dnuSet.add('gpu');
  if (!psuBlockUpgr && !psuDanger)             dnuSet.add('psu');
  dnuSet.delete(best.key);

  /* ============================================================
     01 — PERFORMANCE DIAGNOSIS
     ============================================================ */
  const isTr = currentLang === 'tr';
  const resLabel  = {'1080':'1080p','1440':'1440p','4k':'4K'}[res] || res || '1080p';
  const gameLabel = (isTr ? {
    compfps:'rekabetçi FPS', mmorpg:'MMORPG', aaa:'AAA / açık dünya',
    battle:'battle royale', sim:'simülasyon / strateji', racing:'yarış / uçuş simülasyonu',
    modded:'modlu oyunlar', stream:'yayın / kayıt', mixed:'genel oyun'
  } : {
    compfps:'competitive FPS', mmorpg:'MMORPG', aaa:'AAA / open-world',
    battle:'battle royale', sim:'simulation / strategy', racing:'racing / flight sim',
    modded:'modded games', stream:'streaming', mixed:'general gaming'
  })[game] || inTr('general gaming', 'genel oyun');
  const cpuName = el('cpu').selectedOptions[0].text;
  const gpuName = el('gpu').selectedOptions[0].text;

  let diagKey, diagLabel, diagClass, diagText;

  if (psuDanger && psuW > 0) {
    diagKey='psu'; diagLabel=inTr('PSU Risk','PSU Riski'); diagClass='dp-psu';
    diagText = inTr(
      'Your PSU (' + psuW + 'W) is likely insufficient for the ' + gpuName + '. This is a hardware safety issue — instability or damage is possible. Fix this before anything else.',
      'PSU (' + psuW + 'W), ' + gpuName + ' için büyük ihtimalle yetersiz. Bu bir donanım güvenliği riski — kararsızlık veya hasar mümkün. Her şeyden önce bunu çöz.'
    );
  } else if (ramGB === 8) {
    diagKey='ram'; diagLabel=inTr('RAM Limited','RAM Sınırlıyor'); diagClass='dp-ram';
    diagText = inTr(
      '8 GB of RAM is critically low for modern gaming. You are almost certainly experiencing stutters, hitching, and slow load times. 16 GB kits are cheap and will likely be your most impactful fix.',
      '8 GB RAM modern oyunlar için kritik seviyede düşük. Büyük ihtimalle takılma, hitching ve yavaş yükleme süreleri yaşıyorsun. 16 GB kitler ucuz ve muhtemelen en etkili düzeltme bu olur.'
    );
  } else if (isSingleCh) {
    diagKey='ram'; diagLabel=inTr('RAM Config Issue','RAM Kurulum Sorunu'); diagClass='dp-ram';
    diagText = inTr(
      'Your RAM is running in single-channel mode, which cuts memory bandwidth by roughly 50%. This is likely dragging down performance across all workloads. Fix this for free before buying any hardware — just move your sticks to the correct dual-channel slots.',
      'RAM tek kanal modunda çalışıyor; bu bellek bant genişliğini yaklaşık %50 düşürür. Bu durum genel performansı ciddi şekilde aşağı çekebilir. Yeni parça almadan önce bunu ücretsiz çöz — RAM’leri doğru çift kanal slotlarına tak.'
    );
  } else if (psuP >= 7) {
    diagKey='psu'; diagLabel=inTr('PSU Risk','PSU Riski'); diagClass='dp-psu';
    diagText = inTr(
      'Your GPU upgrade path is blocked by PSU readiness. Your current PSU cannot safely support the next GPU tier. Fix this before buying a new GPU.',
      'GPU yükseltme yolunu PSU sınırlandırıyor. Mevcut güç kaynağın bir sonraki GPU seviyesini güvenli şekilde taşıyamayabilir. Yeni ekran kartı almadan önce bunu çöz.'
    );
  } else if (gpuP > cpuP && gpuP >= 4) {
    diagKey='gpu'; diagLabel=inTr('GPU Limited','GPU Sınırlıyor'); diagClass='dp-gpu';
    diagText = inTr(
      'Your GPU (' + gpuName + ', score ' + gpuSc + '/10) is the primary limiter at ' + resLabel + ' / ' + hz + 'Hz for ' + gameLabel + '. A GPU upgrade is usually the highest-impact hardware change at this resolution.',
      resLabel + ' / ' + hz + 'Hz seviyesinde ' + gameLabel + ' için sistemi büyük ihtimalle ekran kartı sınırlıyor. ' + gpuName + ' (puan ' + gpuSc + '/10) bu profil için ana limit gibi görünüyor. Bu çözünürlükte en yüksek etkiyi genelde GPU yükseltmesi verir.'
    );
  } else if (cpuP > gpuP && cpuP >= 4) {
    diagKey='cpu'; diagLabel=inTr('CPU Limited','CPU Sınırlıyor'); diagClass='dp-cpu';
    diagText = isTr
      ? 'İşlemcin (' + cpuName + ', puan ' + cpuSc + '/10) muhtemelen ana darboğaz.' +
        (cpuGpuGap >= 3 ? ' Ekran kartının (puan ' + gpuSc + '/10) işlemcinin izin verdiğinden daha fazla potansiyeli var.' : '') +
        (game === 'compfps' ? ' Rekabetçi FPS oyunlarında yüksek yenileme hızı için işlemci tutarlılığı çok önemlidir.' : '') +
        (game === 'stream'  ? ' Yayın/kayıt işlemciye ekstra yük bindirir.' : '')
      : 'Your CPU (' + cpuName + ', score ' + cpuSc + '/10) is likely the main bottleneck.' +
        (cpuGpuGap >= 3 ? ' Your GPU (score ' + gpuSc + '/10) has more headroom than the CPU allows it to use.' : '') +
        (game === 'compfps' ? ' Competitive FPS is heavily CPU-dependent for high-refresh consistency.' : '') +
        (game === 'stream'  ? ' Streaming places high load on the CPU.' : '');
  } else if (best.score <= 2) {
    diagKey='opt'; diagLabel=inTr('Optimize First','Önce Optimize Et'); diagClass='dp-opt';
    diagText = inTr(
      'Your system appears reasonably balanced for your use case. No single hardware upgrade offers strong value right now. Work through the free fixes first.',
      'Sistemin bu kullanım için makul derecede dengeli görünüyor. Şu an tek başına çok güçlü değer sunan bir donanım yükseltmesi yok. Önce ücretsiz kontrolleri uygula.'
    );
  } else {
    diagKey='bal'; diagLabel=inTr('Mostly Balanced','Büyük Ölçüde Dengeli'); diagClass='dp-bal';
    diagText = inTr(
      'No dominant bottleneck found. A targeted upgrade can still help — validate with the tools in Section 03 before buying.',
      'Baskın bir darboğaz görünmüyor. Hedefli bir yükseltme yine işe yarayabilir; satın almadan önce 03. bölümdeki araçlarla doğrula.'
    );
  }
  /* ============================================================
     02 — FREE PERFORMANCE FIXES (Checklist)
     Conditional — shows the most relevant 5–8 fixes based on
     diagnosis, game type, and hardware profile.
     Does NOT show everything to everyone.
     Language: "may help", "check first" — no FPS overclaiming.
     ============================================================ */
  const checks = [];

  // ── Decide which categories to show ──────────────────────────
  const showGPU     = diagKey === 'gpu' || best.key === 'gpu';
  const showCPU     = diagKey === 'cpu' || best.key === 'cpu' ||
                      game === 'compfps' || game === 'mmorpg' || game === 'sim';
  const showMemory  = diagKey === 'ram' || best.key === 'ramcap' ||
                      best.key === 'ramspd' || isSingleCh || ramSpd === 0;
  const showStutter = goal === 'smooth' || goal === 'latency'   ||
                      game === 'modded' || game === 'mmorpg'     ||
                      game === 'aaa'    || game === 'mixed' || hddGameDrive;

  // ── Windows ──────────────────────────────────────────────────
  // Core actions: short, broadly useful, and worth doing before buying hardware.
  checks.push({g:'Windows', t:inTr('Disable unnecessary startup apps in Task Manager.','Görev Yöneticisi’nden gereksiz başlangıç uygulamalarını kapat.')});
  checks.push({g:'Windows', t:isLaptop
    ? inTr('Plug in the charger and enable Windows or OEM performance mode.','Adaptörü tak ve Windows veya üretici performans modunu aç.')
    : inTr('Use Balanced power mode and make sure Power Saver is off.','Dengeli güç modunu kullan ve Güç Tasarrufu’nun kapalı olduğundan emin ol.')});
  checks.push({g:'Windows', t:inTr('Set your monitor to its maximum refresh rate in Windows.','Windows’ta monitörünü maksimum yenileme hızına ayarla.')});
  checks.push({g:'Windows', t:inTr('Close unused browsers, launchers, recording tools, and overlays before gaming.','Oyuna başlamadan önce kullanmadığın tarayıcıları, launcher’ları, kayıt araçlarını ve overlay’leri kapat.')});
  checks.push({g:'Windows', t:inTr('Enable Windows Game Mode.','Windows Oyun Modu’nu aç.')});


  // ── System / Cooling / Display ──────────────────────────────
  if (osVersion === 'win10' && isModernIntelHybrid) {
    checks.push({g:'Windows Version', t:inTr('Test Windows 11 scheduling with this hybrid Intel CPU before upgrading hardware.','Donanım yükseltmeden önce bu hibrit Intel CPU ile Windows 11 zamanlamasını test et.')});
  }
  if (hz === 60 && (game === 'compfps' || goal === 'latency' || goal === 'fps')) {
    checks.push({g:'Display / Monitor', t:inTr('Confirm Windows is not limiting a high-refresh monitor to 60 Hz.','Windows’un yüksek yenileme hızlı monitörü 60 Hz’e sınırlamadığını doğrula.')});
  }
  if (isLaptop) {
    checks.push({g:'Laptop Cooling', t:inTr('Check CPU and GPU temperatures while gaming.','Oyun sırasında CPU ve GPU sıcaklıklarını kontrol et.')});
    checks.push({g:'Laptop Cooling', t:inTr('Use a laptop cooling pad / stand and keep the intake vents open.','Laptop cooling pad / stand kullan ve hava girişlerini açık tut.')});
  } else if (strongCpu && (weakCooler || unknownCooler)) {
    checks.push({g:'Cooling / Thermals', t:inTr('Check CPU temperatures and boost clocks while gaming.','Oyun sırasında CPU sıcaklıklarını ve boost frekanslarını kontrol et.')});
  }
  if (hddGameDrive) {
    checks.push({g:'Storage Upgrade', t:inTr('Move the game from HDD to SSD or NVMe.','Oyunu HDD’den SSD veya NVMe’ye taşı.')});
  }

  // ── GPU ──────────────────────────────────────────────────────
  // Show when GPU is the diagnosed or recommended bottleneck.
  if (showGPU) {
    checks.push({g:'GPU', t:inTr('Update the GPU driver from NVIDIA, AMD, or Intel.','GPU sürücüsünü NVIDIA, AMD veya Intel’den güncelle.')});
    checks.push({g:'GPU', t:inTr('Check GPU usage and temperature while gaming.','Oyun sırasında GPU kullanımını ve sıcaklığını kontrol et.')});
    checks.push({g:'GPU', t:inTr('Try DLSS, FSR, or XeSS if the game supports it.','Oyun destekliyorsa DLSS, FSR veya XeSS’i dene.')});
  }

  // ── CPU ──────────────────────────────────────────────────────
  // Show when CPU is the bottleneck or game type is CPU-sensitive.
  if (showCPU) {
    checks.push({g:'CPU', t:inTr('Update the chipset driver from AMD or Intel.','Chipset sürücüsünü AMD veya Intel’den güncelle.')});
    checks.push({g:'CPU', t:inTr('Check CPU temperature and boost clocks while gaming.','Oyun sırasında CPU sıcaklığını ve boost frekanslarını kontrol et.')});
  }

  // ── Memory ───────────────────────────────────────────────────
  // Show when RAM capacity, speed, or channel mode is a factor.
  if (showMemory) {
    if (isSingleCh) {
      checks.push({g:'Memory', t:inTr('Move the RAM sticks to the correct dual-channel slots.','RAM modüllerini doğru çift kanal slotlarına taşı.')});
    }
    checks.push({g:'Memory', t:inTr('Verify RAM speed and dual-channel mode in CPU-Z.','CPU-Z’de RAM hızını ve çift kanal modunu doğrula.')});
    if (ramSpd === 0) {
      checks.push({g:'Memory', t:inTr('Enable XMP or EXPO in BIOS, then verify the RAM speed in CPU-Z.','BIOS’ta XMP veya EXPO’yu aç, ardından RAM hızını CPU-Z’de doğrula.')});
    }
  }

  // ── Storage / Stutter ────────────────────────────────────────
  // Show when stutter, open-world streaming, or large/modded games are relevant.
  if (showStutter) {
    checks.push({g:'Storage / Stutter', t:inTr('Measure frametime and 1% lows with CapFrameX or RTSS.','CapFrameX veya RTSS ile frametime ve 1% low değerlerini ölç.')});
  }

  // TODO: BIOS Optimization module (future revision)
  //   - XMP/EXPO enable and verify
  //   - CPU power limits: PBO, MCE, Intel PL1/PL2
  //   - Memory sub-timings guidance
  // TODO: NVIDIA / AMD driver settings module (future revision)
  //   - Low-latency mode, shader cache, image sharpening
  //   - Radeon Anti-Lag, NVIDIA Reflex
  // TODO: Temperature & stability testing module (future revision)
  //   - Throttle detection, OCCT, Prime95, MemTest86

  /* ============================================================
     03 — BEFORE YOU BUY: VALIDATE THE BOTTLENECK
     ============================================================ */
  const benches = [];

  if (diagKey === 'gpu' || best.key === 'gpu') {
    benches.push({g:'Confirm GPU Bottleneck', items:[
      inTr('MSI Afterburner (free) — GPU usage % and temperature overlay during gameplay','MSI Afterburner (ücretsiz) — oyun sırasında GPU kullanım yüzdesi ve sıcaklık overlay’i'),
      inTr('If GPU usage is sustained at 95–99%, the GPU is your confirmed bottleneck','GPU kullanımı sürekli %95–99 seviyesindeyse darboğaz büyük ihtimalle GPU’dur'),
      inTr('3DMark Time Spy (free basic) — standardised GPU benchmark to compare against known scores','3DMark Time Spy (ücretsiz basic) — bilinen skorlarla karşılaştırmak için standart GPU benchmark’ı'),
      inTr('Unigine Superposition (free) — heavy GPU stress test for temperature stability','Unigine Superposition (ücretsiz) — sıcaklık/stabilite için ağır GPU stres testi'),
    ]});
  }
  if (diagKey === 'cpu' || best.key === 'cpu') {
    benches.push({g:'Confirm CPU Bottleneck', items:[
      inTr('HWiNFO64 (free) — per-core temperatures, boost clocks, and power draw in real time','HWiNFO64 (ücretsiz) — çekirdek sıcaklıkları, boost frekansları ve güç tüketimi'),
      inTr('Cinebench R23 or R24 (free) — CPU score to compare against known results for your model','Cinebench R23 veya R24 (ücretsiz) — işlemci skorunu aynı modelin bilinen sonuçlarıyla karşılaştır'),
      inTr('In-game: large gap between average FPS and 1% lows (e.g. 120 avg / 45 1%) usually means CPU or RAM','Oyun içinde ortalama FPS ile 1% low arasında büyük fark varsa (örn. 120 avg / 45 1%) genelde CPU veya RAM tarafına bakılır'),
    ]});
  }
  if (isLaptop || (strongCpu && (weakCooler || unknownCooler))) {
    benches.push({g:'Cooling Validation', items:[
      inTr('HWiNFO64 — watch CPU temperature, effective clocks, and thermal throttling flags during a real game session','HWiNFO64 — gerçek oyun sırasında CPU sıcaklığı, efektif frekans ve thermal throttling uyarılarını izle'),
      inTr('If clocks drop hard while temperatures are high, cooling may be the issue rather than the CPU itself','Sıcaklık yüksekken frekanslar ciddi düşüyorsa sorun işlemcinin kendisi değil soğutma olabilir'),
      inTr('For laptops: clean vents/fans first; for desktops: verify cooler mounting, fan curve, thermal paste, and case airflow','Laptopta önce fan/ızgara temizliği; masaüstünde soğutucu montajı, fan eğrisi, termal macun ve kasa hava akışını doğrula'),
    ]});
  }

  if (diagKey === 'ram' || best.key === 'ramcap' || best.key === 'ramspd' || ramConfigPenalty >= 3) {
    benches.push({g:'Confirm RAM Issue', items:[
      inTr('CPU-Z (free) — Memory tab shows actual running speed and dual-channel status','CPU-Z (ücretsiz) — Memory sekmesi gerçek çalışan RAM hızını ve çift kanal durumunu gösterir'),
      inTr('Verify RAM speed and dual-channel mode with CPU-Z before buying any RAM upgrade','Yeni RAM almadan önce CPU-Z ile RAM hızını ve çift kanal modunu doğrula'),
      inTr('OCCT Memory Test (free) — stability check, especially after changing slot configuration','OCCT Memory Test (ücretsiz) — özellikle slot değişiminden sonra stabilite kontrolü'),
    ]});
  }
  if (best.key === 'psu' || psuDanger) {
    benches.push({g:'PSU / Stability Check', items:[
      inTr('Watch for pattern symptoms: shutdowns, black screens, BSOD, or driver crashes specifically under load','Özellikle yük altında kapanma, siyah ekran, mavi ekran veya sürücü çökmesi gibi belirtileri takip et'),
      inTr('OCCT Power Test — can reveal PSU instability (do not run on systems you already suspect are unstable)','OCCT Power Test — PSU kararsızlığını gösterebilir; zaten şüpheli sistemde çalıştırma'),
    ]});
    benches.push({g:'Warning', items:[
      inTr('\u26a0\ufe0f Do not stress test a system you already believe has a PSU issue — fix it first.','\u26a0\ufe0f PSU sorunu olduğundan şüphelendiğin sistemi stres testine sokma — önce PSU tarafını çöz.')], warn:true});
  }
  if (game === 'compfps' || goal === 'smooth' || goal === 'latency') {
    benches.push({g:'Stutter & Frametime', items:[
      inTr('CapFrameX (free) — frametime recording during gameplay','CapFrameX (ücretsiz) — oyun sırasında frametime kaydı'),
      inTr('RTSS (RivaTuner Statistics Server) — frametime graph overlay in-game','RTSS (RivaTuner Statistics Server) — oyun içinde frametime grafiği'),
      inTr('Look at 1% lows alongside average FPS — stutter shows as high average with poor lows','Ortalama FPS ile beraber 1% low değerlerine bak — stutter, yüksek ortalama ama kötü low değerleriyle görünür'),
    ]});
  }
  if (benches.length === 0) {
    benches.push({g:'General Checks', items:[
      inTr('3DMark (free basic) — overall system benchmark','3DMark (ücretsiz basic) — genel sistem benchmark’ı'),
      inTr('HWiNFO64 — system sensor data for temperatures and clock speeds','HWiNFO64 — sıcaklık ve frekanslar için sistem sensör verisi'),
    ]});
  }


  function recommendedGpuTier() {
    return getCurrentGpuRecommendations({
      budgetUSD,
      resolution: res,
      hz,
      goal,
      currentGpuScore: gpuSc,
      cpuScore: cpuSc,
      psuMaxScore: psuMaxNow,
    }).targetScore;
  }

  function gpuTargetTierText() {
    const target = recommendedGpuTier();
    const tiers = {
      6: 'RTX 5060 / RX 9060 XT class',
      7: 'RTX 5060 Ti / RX 9060 XT 16GB class',
      8: 'RTX 5070 / RX 9070 class',
      9: 'RTX 5070 Ti / RX 9070 XT class',
      10:'RTX 5080 / current flagship class'
    };
    return tiers[target] || tiers[8];
  }

  function cpuTargetTierText() {
    if (game === 'compfps' || goal === 'latency' || goal === 'fps') {
      return inTr('Ryzen X3D / recent i5-i7 gaming tier', 'Ryzen X3D / güncel i5-i7 oyun seviyesi');
    }
    return inTr('modern 6-core / 8-core gaming tier', 'modern 6 çekirdek / 8 çekirdek oyun seviyesi');
  }

  /* ============================================================
     04 — BEST NEXT UPGRADE
     ============================================================ */
  const PART_META = {
    gpu:    {name:inTr('Graphics Card (GPU)','Ekran Kartı (GPU)'), sub:inTr('Biggest gain for visuals and frame rate','Görsel kalite ve FPS için en büyük etki'), icon:'&#9646;', icls:'ui-gpu'},
    cpu:    {name:inTr('Processor (CPU)','İşlemci (CPU)'), sub:inTr('Ana işlem gücü ve FPS tavanı','Ana işlem gücü ve FPS tavanı'), icon:'&#9643;', icls:'ui-cpu'},
    ramcap: {name:inTr('RAM Capacity','RAM Kapasitesi'), sub:inTr('More memory reduces stutters and hitching','Daha fazla bellek takılmaları azaltabilir'), icon:'&#9644;', icls:'ui-ram'},
    ramspd: {name:inTr('RAM Speed','RAM Hızı'), sub:inTr('Faster timings feed the CPU better','Daha hızlı RAM işlemciyi daha iyi besler'), icon:'&#9654;', icls:'ui-ram'},
    psu:    {name:inTr('Power Supply (PSU)','Güç Kaynağı (PSU)'), sub:inTr('Required before any GPU upgrade','GPU yükseltmesinden önce gerekebilir'), icon:'&#9889;', icls:'ui-psu'},
    ramconfig:{name:inTr('Fix RAM Configuration First','Önce RAM Yapılandırmasını Düzelt'), sub:inTr('Restore dual-channel mode before buying hardware','Donanım almadan önce çift kanal modunu etkinleştir'), icon:'&#10003;',icls:'ui-ram'},
    none:   {name:inTr('No Hardware Upgrade Yet','Şimdilik Donanım Yükseltme Yok'), sub:inTr('Optimize and verify first','Önce optimize et ve doğrula'), icon:'&#10003;',icls:'ui-none'},
  };
  const PART_LABEL = {gpu:'GPU',cpu:'CPU',ramcap:inTr('RAM Capacity','RAM Kapasitesi'),ramspd:inTr('RAM Speed','RAM Hızı'),psu:'PSU'};

  const goalLabel = (isTr ? {
    none:'genel performans', fps:'daha yüksek FPS', visuals:'daha iyi görsel kalite',
    smooth:'daha akıcı oynanış', latency:'daha düşük gecikme',
    stream:'yayın kalitesi', future:'geleceğe dönük sistem', cheap:'en ucuz iyileştirme',
  } : {
    none:'general performance', fps:'higher FPS', visuals:'better visual quality',
    smooth:'smoother gameplay', latency:'lower latency',
    stream:'streaming quality', future:'future-proofing', cheap:'cheapest improvement',
  })[goal];

  let whyText = '';
  if (singleChannelPreBuyBlocker) {
    whyText = inTr(
      'Your RAM is already 16GB or higher, but it is running in single-channel mode. Do not buy CPU/GPU parts yet. First verify slot placement with CPU-Z and fix dual-channel mode; then rerun the analysis.',
      'RAM kapasiten 16 GB veya üstü ama tek kanal çalışıyor. Şimdilik CPU/GPU parçası alma. Önce CPU-Z ile slot/kanal durumunu doğrula, RAM’i çift kanala al ve analizi tekrar çalıştır.'
    );
  } else if (isLaptop && best.score <= 2) {
    whyText = inTr(
      'Laptop selected: CPU and GPU upgrades are usually not practical. Focus on fan/vent cleaning, thermal throttling checks, RAM/storage options, and power mode before spending money.',
      'Laptop seçildi: CPU ve GPU yükseltmeleri çoğu modelde pratik değildir. Para harcamadan önce fan/ızgara temizliği, thermal throttling kontrolü, RAM/depolama seçenekleri ve güç moduna odaklan.'
    );
  } else if (best.key === 'gpu') {
    whyText = isTr
      ? resLabel + ' / ' + hz + 'Hz seviyesinde ' + gameLabel + ' oynarken ' + goalLabel + ' hedefi için en yüksek etkiyi muhtemelen GPU yükseltmesi verir. ' + gpuName + ' (puan ' + gpuSc + '/10) bu profil için ' + (gpuSc < 5 ? 'zayıf kalıyor' : gpuSc < 7 ? 'sınırlayıcı görünüyor' : 'fena değil ama ekran hedefinle tam eşleşmiyor') + '. Minimum hedef: ' + gpuTargetTierText() + '. Satın almadan önce 03. bölümdeki testlerle doğrula.'
      : 'At ' + resLabel + ' / ' + hz + 'Hz playing ' + gameLabel + ', the GPU is estimated to be your highest-impact upgrade for ' + goalLabel + '. Your ' + gpuName + ' (score ' + gpuSc + '/10) is ' + (gpuSc < 5 ? 'under-powered' : gpuSc < 7 ? 'limiting' : 'decent but not fully matched to your display') + ' for this profile. Minimum target: ' + gpuTargetTierText() + '. Validate with benchmarks in Section 03 before purchasing.';
  } else if (best.key === 'cpu') {
    whyText = isTr
      ? gameLabel + ' için ' + resLabel + ' / ' + hz + 'Hz seviyesinde işlemcin (' + cpuName + ', puan ' + cpuSc + '/10) muhtemel tavanı belirliyor.' + (cpuGpuGap >= 3 ? ' Ekran kartının (puan ' + gpuSc + '/10) işlemcinin izin verdiğinden daha fazla potansiyeli var.' : '') + ' Hedef seviye: ' + cpuTargetTierText() + '. Satın almadan önce HWiNFO64 ile doğrula.'
      : 'For ' + gameLabel + ' at ' + resLabel + ' / ' + hz + 'Hz, your CPU (' + cpuName + ', score ' + cpuSc + '/10) is the likely ceiling.' + (cpuGpuGap >= 3 ? ' Your GPU (score ' + gpuSc + '/10) has more capability than your CPU allows.' : '') + ' Target tier: ' + cpuTargetTierText() + '. Confirm with HWiNFO64 before buying.';
  } else if (best.key === 'ramcap') {
    whyText = isTr
      ? (ramGB === 8 ? '8 GB modern oyunların çoğunda gerçek takılmalara sebep olabilir. Çoğu oyun en az 12–16 GB ister. ' : '16 GB, ' + gameLabel + ' yükleri için sınırda kalabilir. ') + 'RAM kapasitesi yükseltmesi genelde en ucuz ve etkili değişikliklerden biridir.'
      : (ramGB === 8 ? '8 GB causes real stutters in most modern games. Most titles require 12–16 GB minimum. ' : '16 GB is tight for ' + gameLabel + ' workloads. ') + 'RAM capacity upgrades are usually the cheapest high-impact change available.';
  } else if (best.key === 'ramspd') {
    whyText = inTr(
      'Your RAM speed is leaving performance on the table. Before buying new sticks, verify your actual running speed with CPU-Z and confirm XMP/EXPO is enabled in BIOS. If already running at full rated speed, upgrading to DDR4 3600+ is estimated to improve 1% lows and FPS in CPU-sensitive titles.',
      'RAM hızın performansı masada bırakıyor olabilir. Yeni RAM almadan önce CPU-Z ile gerçek çalışma hızını kontrol et ve BIOS’ta XMP/EXPO’nun açık olduğunu doğrula. Zaten tam hızda çalışıyorsa DDR4 3600+ seviyesine geçmek CPU’ya hassas oyunlarda 1% low ve FPS tarafında yardımcı olabilir.'
    );
  } else if (best.key === 'psu') {
    whyText = isTr
      ? 'PSU (' + (psuW||'bilinmiyor') + 'W) ' + (psuDanger ? 'mevcut GPU için yetersiz görünüyor — güvenlik riski. ' : 'bir sonraki GPU seviyesi için sınırlı görünüyor. ') + 'GPU almadan önce en az ' + (nextGpuSc >= 9 ? '850W 80+ Gold' : nextGpuSc >= 7 ? '750W 80+ Gold' : '650W 80+ Bronze') + ' seviyesine çık.'
      : 'Your PSU (' + (psuW||'unknown') + 'W) is ' + (psuDanger ? 'insufficient for your current GPU — safety issue. ' : 'too limited for the next GPU tier. ') + 'Upgrade to at least ' + (nextGpuSc >= 9 ? '850W 80+ Gold' : nextGpuSc >= 7 ? '750W 80+ Gold' : '650W 80+ Bronze') + ' before any GPU purchase.';
  } else {
    whyText = inTr(
      'No single hardware upgrade offers strong estimated value for your current setup. Work through the free fixes in Section 02 and validate the actual bottleneck in Section 03 before spending.',
      'Mevcut sistem için tek başına güçlü değer sunan net bir yükseltme görünmüyor. Para harcamadan önce 02. bölümdeki ücretsiz kontrolleri uygula ve 03. bölümde gerçek darboğazı doğrula.'
    );
  }

  /* ============================================================
     05 — PSU RECOMMENDATION FOR NEXT GPU TIER
     ============================================================ */
  const psuNeedWatts = [0,300,350,400,450,500,550,600,700,750,850][nextGpuSc] || 700;
  const psuRecEff    = nextGpuSc >= 7 ? inTr('80+ Gold or better','80+ Gold veya daha iyi') : inTr('80+ Bronze minimum, Gold preferred','En az 80+ Bronze, tercihen Gold');
  const psuRecWatts  = nextGpuSc >= 9 ? '850W+' : nextGpuSc >= 7 ? '750W' : nextGpuSc >= 5 ? '650W' : '550W';

  let psuVerdictText, psuVerdictCls;
  if (psuW === 0) {
    psuVerdictText = inTr('PSU wattage not entered — enter it for a specific verdict.','PSU watt değeri girilmemiş — net yorum için watt değerini gir.');
    psuVerdictCls  = 'pv-warn';
  } else if (psuW >= psuNeedWatts * 1.15) {
    psuVerdictText = inTr('Your PSU (' + psuW + 'W) appears sufficient for the next GPU tier.','PSU (' + psuW + 'W), bir sonraki GPU seviyesi için yeterli görünüyor.');
    psuVerdictCls  = 'pv-ok';
  } else if (psuW >= psuNeedWatts * 0.88) {
    psuVerdictText = inTr('Borderline — ' + psuW + 'W is close to the minimum for the next GPU tier. Verify PSU quality before buying.','Sınırda — ' + psuW + 'W bir sonraki GPU seviyesi için minimuma yakın. Satın almadan önce PSU kalitesini doğrula.');
    psuVerdictCls  = 'pv-warn';
  } else {
    psuVerdictText = isTr ? 'GPU yükseltme yolunu büyük ihtimalle PSU sınırlıyor. ' + (psuW||'Bilinmiyor') + 'W, bir sonraki seviye için yetersiz görünüyor (' + psuRecWatts + ' önerilir).' : 'Your GPU upgrade path is likely blocked by PSU readiness. ' + (psuW||'Unknown') + 'W is estimated to be insufficient for the next tier (' + psuRecWatts + ' recommended).';
    psuVerdictCls  = 'pv-bad';
  }

  function buildUpgradePath() {
    if (isLaptop) return [];
    const cards = [];
    const oldIntelPlatform =
      cpuKey.startsWith('i5_6') || cpuKey.startsWith('i7_6') ||
      cpuKey.startsWith('i5_7') || cpuKey.startsWith('i7_7') ||
      cpuKey.startsWith('i5_8') || cpuKey.startsWith('i7_8') ||
      cpuKey.startsWith('i5_9') || cpuKey.startsWith('i7_9') || cpuKey.startsWith('i9_9');
    const am4Platform =
      cpuKey.startsWith('r3_3') || cpuKey.startsWith('r5_1') || cpuKey.startsWith('r5_2') ||
      cpuKey.startsWith('r5_3') || cpuKey.startsWith('r5_5') || cpuKey.startsWith('r7_2') ||
      cpuKey.startsWith('r7_5') || cpuKey.startsWith('r9_5');
    const weakWholeSystem = cpuSc <= 5 && gpuSc <= 5;
    const rebuildBudget = budgetUSD >= 650 || budgetN === 0;

    if (!singleChannelPreBuyBlocker && weakWholeSystem && rebuildBudget && !isLaptop) {
      cards.push({
        k: inTr('Full build path','Sifirdan kasa rotasi'),
        t: inTr('CPU + motherboard + RAM + GPU together','CPU + anakart + RAM + GPU birlikte'),
        c: inTr('Your CPU and GPU are both older tiers. If the budget allows, a clean new build may be better value than stacking upgrades on the old platform.','CPU ve GPU birlikte eski seviyede. Butce yetiyorsa eski platforma parca eklemek yerine temiz bir kasa toplamak daha mantikli olabilir.')
      });
    }

    if (best.key === 'cpu') {
      if (am4Platform && cpuSc <= 6) {
        cards.push({
          k: inTr('Platform-aware CPU path','Platforma uygun CPU rotasi'),
          t: inTr('AM4: Ryzen 7 5700X3D / 5800X3D class','AM4: Ryzen 7 5700X3D / 5800X3D seviyesi'),
          c: inTr('Often keeps your current motherboard and DDR4 RAM. Verify BIOS support before buying.','Cogu durumda mevcut anakart ve DDR4 RAM korunur. Satin almadan once BIOS destegini dogrula.')
        });
      } else if (oldIntelPlatform) {
        cards.push({
          k: inTr('Platform bundle','Platform paketi'),
          t: inTr('CPU + motherboard, RAM if platform changes','CPU + anakart, platform degisirse RAM'),
          c: inTr('Older Intel platforms usually need a motherboard change for a meaningful CPU jump. DDR5 is optional only if you move to a DDR5 platform.','Eski Intel platformlarda anlamli CPU sicrama icin genelde anakart degisir. DDR5 sadece DDR5 platforma gecersen gerekir.')
        });
      } else {
        cards.push({
          k: inTr('CPU-first path','CPU oncelikli rota'),
          t: cpuTargetTierText(),
          c: inTr('Keep the GPU if benchmarks confirm CPU limit first. Recheck GPU need after the CPU upgrade.','Benchmark CPU sinirini dogruluyorsa once GPUyu koru. CPU yukseltmeden sonra GPU ihtiyacini tekrar kontrol et.')
        });
      }
    }

    if (best.key === 'gpu') {
      cards.push({
        k: inTr('GPU path','GPU rotasi'),
        t: gpuTargetTierText(),
        c: psuBlockUpgr
          ? inTr('Buy PSU first or with the GPU; the current PSU may block this upgrade path.','PSU mevcut rotayi sinirlayabilir; GPU ile birlikte ya da once PSU al.')
          : inTr('Your PSU looks acceptable for the next tier. Validate CPU headroom before overspending on a very high-end GPU.','PSU sonraki seviye icin kabul edilebilir gorunuyor. Cok ust GPUya cikmadan CPU payini dogrula.')
      });
    }

    if (best.key === 'ramcap') {
      cards.push({
        k: inTr('Memory path','Bellek rotasi'),
        t: inTr('2x16 GB dual-channel kit','2x16 GB cift kanal kit'),
        c: inTr('Capacity and dual-channel matter more than chasing extreme speed for most users.','Cogu kullanici icin kapasite ve cift kanal, asiri hiz kovalamaktan daha onemli.')
      });
    }

    if (best.key === 'psu') {
      cards.push({
        k: inTr('Safety-first path','Guvenlik oncelikli rota'),
        t: psuRecWatts + ' ' + psuRecEff,
        c: inTr('Do this before a GPU purchase if PSU readiness is the blocker.','PSU hazirligi blokajsa GPU satin almadan once bunu yap.')
      });
    }

    if (cards.length === 0) {
      cards.push({
        k: inTr('Conservative path','Temkinli rota'),
        t: inTr('Optimize, measure, then choose parts','Optimize et, olc, sonra parca sec'),
        c: inTr('No clear multi-part purchase is justified from the current inputs.','Mevcut girdilerle net bir coklu parca satin alimi hakli gorunmuyor.')
      });
    }

    return cards.slice(0, 3);
  }

  /* ============================================================
     06 — BUDGET FIT & ESTIMATED PRICE RANGE
     ============================================================ */
  let priceKey = null;
  if (best.key === 'gpu') {
    priceKey = gpuSc <= 4 ? 'gpu_lo' : gpuSc <= 7 ? 'gpu_mid' : 'gpu_hi';
  } else if (best.key === 'cpu') {
    priceKey = cpuSc >= 7 ? 'cpu_hi' : 'cpu_lo';
  } else if (best.key === 'ramcap') { priceKey = 'ramcap'; }
  else if (best.key === 'ramspd')   { priceKey = 'ramspd'; }
  else if (best.key === 'psu')      { priceKey = 'psu'; }
  if (best.score <= 1 || singleChannelPreBuyBlocker || (isLaptop && (best.key === 'gpu' || best.key === 'cpu' || best.key === 'psu'))) {
    priceKey = null;
  }

  let budgetFitLabel, budgetFitCls, budgetFitNote;
  if (!priceKey || best.score <= 1) {
    budgetFitLabel = inTr('N/A','Yok'); budgetFitCls = 'c-mid';
    budgetFitNote  = singleChannelPreBuyBlocker
      ? inTr('Fix dual-channel RAM first before spending money.','Para harcamadan önce RAM’i çift kanala al.')
      : inTr('No hardware purchase recommended right now.','Şu an donanım satın alma önerilmiyor.');
  } else if (currency === 'try' && false) {
    budgetFitLabel = inTr('Live Price Needed','Güncel Fiyat Gerekli'); budgetFitCls = 'c-mid';
    budgetFitNote  = inTr('TRY prices move too much for a static estimate. Use this as a part priority result, then compare today’s local prices.','TL fiyatları çok oynak olduğu için burada net fiyat uydurmuyorum. Bu sonucu parça önceliği olarak kullan, sonra bugünkü yerel fiyatla karşılaştır.');
  } else if (budgetN === 0) {
    budgetFitLabel = inTr('Price Discovery','Fiyat Kesfi'); budgetFitCls = 'c-mid';
    budgetFitNote  = inTr('No budget entered, so this result shows sensible price tiers instead of a buy/no-buy verdict.','Butce girilmedi; bu sonuc satin al/alma karari yerine mantikli fiyat katmanlari gosterir.');
  } else {
    const band = PRICE_USD[priceKey];
    const fitMin = currency === 'try' ? band[0] * TRY_USED_FACTOR : band[0];
    const fitMax = currency === 'try' ? band[1] * 1.05 : band[1];
    if (budgetUSD >= fitMax * 1.15) {
      budgetFitLabel = inTr('Fits Comfortably','Rahat Yetiyor'); budgetFitCls = 'c-byes';
      budgetFitNote  = inTr('Your budget comfortably covers the estimated cost range.','Bütçen tahmini maliyet aralığını rahat karşılıyor.');
    } else if (budgetUSD >= fitMin) {
      budgetFitLabel = inTr('Tight But Possible','Sınırda Ama Olabilir'); budgetFitCls = 'c-btight';
      budgetFitNote  = inTr('Budget is in range but tight. Used or open-box market may help.','Bütçe aralığa giriyor ama sınırda. İkinci el veya outlet/open-box seçenekleri yardımcı olabilir.');
    } else {
      budgetFitLabel = inTr('Likely Not Enough','Muhtemelen Yetmez'); budgetFitCls = 'c-bno';
      budgetFitNote  = inTr('Below the estimated starting price. Consider saving more or used market.','Tahmini başlangıç fiyatının altında. Biraz daha bütçe ayırmayı veya ikinci eli düşün.');
    }
  }

  const sc     = best.score;
  const scCls  = sc >= 7 ? 'c-hi'   : sc >= 4 ? 'c-mid'   : 'c-lo';
  const barClr = sc >= 7 ? 'var(--accent)': sc >= 4 ? 'var(--warn)' : 'var(--danger)';
  const gain = estimatedGainForUpgrade();
  const throttleLoss = estimatedThrottleLoss();

  function buildResultDiagnostics() {
    const maxIssue = Math.max(gpuP, cpuP, ramCapP, ramSpdP, psuP);
    let systemScore = 92 - (maxIssue * 5);
    if (psuDanger) systemScore -= 18;
    if (ramGB === 8) systemScore -= 10;
    if (isSingleCh) systemScore -= 10;
    if (hddGameDrive && showStutter) systemScore -= 5;
    if (throttleLoss.show) systemScore -= 5;
    if (best.score <= 2 && !psuDanger && ramGB > 8 && !isSingleCh) systemScore = Math.max(systemScore, 82);
    systemScore = clamp(Math.round(systemScore), 35, 96);

    let bottleneckKey = 'none';
    if (psuDanger || psuP >= 7 || best.key === 'psu') bottleneckKey = 'psu';
    else if (ramGB === 8 || isSingleCh || best.key === 'ramcap' || best.key === 'ramspd') bottleneckKey = 'ram';
    else if (hddGameDrive && showStutter && best.score <= 3) bottleneckKey = 'storage';
    else if (throttleLoss.show && (weakCooler || unknownCooler) && best.score <= 3) bottleneckKey = 'cooling';
    else if (diagKey === 'gpu' || best.key === 'gpu') bottleneckKey = 'gpu';
    else if (diagKey === 'cpu' || best.key === 'cpu') bottleneckKey = 'cpu';

    const bottleneckLabels = {
      cpu: 'CPU',
      gpu: 'GPU',
      ram: 'RAM',
      psu: 'PSU',
      storage: inTr('Storage', 'Depolama'),
      cooling: inTr('Cooling', 'Soğutma'),
      none: inTr('None', 'Yok')
    };

    const priorityKey = (psuDanger || ramGB === 8 || isSingleCh || best.score >= 6) ? 'high' : best.score >= 3 ? 'medium' : 'low';
    const priorityLabels = {
      low: inTr('Low', 'Düşük'),
      medium: inTr('Medium', 'Orta'),
      high: inTr('High', 'Yüksek')
    };

    let confidenceRank = 3;
    const confidenceReasons = [];

    if (diagKey === 'bal' || diagKey === 'opt' || best.score <= 2) {
      confidenceRank = Math.min(confidenceRank, 2);
      confidenceReasons.push(inTr('no single paid upgrade clearly dominates', 'net şekilde öne çıkan tek ücretli yükseltme yok'));
    }
    if (budgetN === 0 && best.score > 2) {
      confidenceRank = Math.min(confidenceRank, 2);
      confidenceReasons.push(inTr('budget not entered', 'butce girilmedi'));
    }
    if (psuW === 0 && (best.key === 'gpu' || best.key === 'psu' || psuBlockUpgr)) {
      confidenceRank -= 1;
      confidenceReasons.push(inTr('PSU wattage unknown', 'PSU watt degeri bilinmiyor'));
    }
    if (unknownCooler && (diagKey === 'cpu' || throttleLoss.show || best.key === 'cpu')) {
      confidenceRank -= 1;
      confidenceReasons.push(inTr('CPU cooler unknown', 'CPU sogutucusu bilinmiyor'));
    }
    if (gameDrive === 'unknown' && showStutter) {
      confidenceRank -= 1;
      confidenceReasons.push(inTr('game drive type unknown', 'oyun diski turu bilinmiyor'));
    }
    if (isLaptop && best.key !== 'ramcap' && best.key !== 'ramspd') {
      confidenceRank = Math.min(confidenceRank, 2);
      confidenceReasons.push(inTr('laptop thermal and upgrade limits vary', 'laptop sıcaklık ve yükseltme sınırları değişken'));
    }
    if (singleChannelPreBuyBlocker || psuDependencyActive) {
      confidenceRank = Math.min(confidenceRank, 2);
      confidenceReasons.push(inTr('pre-buy blocker must be fixed first', 'satin alma oncesi blokaj once cozulmeli'));
    }
    confidenceRank = clamp(confidenceRank, 1, 3);
    const confidenceKey = confidenceRank === 3 ? 'high' : confidenceRank === 2 ? 'medium' : 'low';
    const confidenceLabels = {
      low: inTr('Low', 'Düşük'),
      medium: inTr('Medium', 'Orta'),
      high: inTr('High', 'Yüksek')
    };

    const limitedInfo = confidenceRank < 3;

    const confidenceNote = limitedInfo && confidenceReasons.length > 0
      ? inTr(
          'Limited by: ' + confidenceReasons.join(', ') + '. Fill these in for a stronger diagnosis.',
          'Sınırlayan: ' + confidenceReasons.join(', ') + '. Daha güçlü tanı için bunları doldur.'
        )
      : limitedInfo
        ? inTr('Some inputs are uncertain. Validate before spending.', 'Bazı girdiler belirsiz. Para harcamadan önce doğrula.')
        : inTr('Inputs are specific enough for a strong first diagnosis.', 'Girdiler ilk tanı için yeterince net.');

    const issueNote = {
      cpu: inTr(cpuName + ' may limit frame consistency at ' + resLabel + ' / ' + hz + 'Hz.', cpuName + ', ' + resLabel + ' / ' + hz + 'Hz seviyesinde kare tutarlılığını sınırlayabilir.'),
      gpu: inTr(gpuName + ' is the likely graphics limiter for this target.', gpuName + ' bu hedefte muhtemel grafik sınırı.'),
      ram: inTr('Memory capacity, speed, or channel mode is affecting the result.', 'Bellek kapasitesi, hızı veya kanal modu sonucu etkiliyor.'),
      psu: inTr('Power readiness may block a safe GPU upgrade path.', 'Güç hazırlığı güvenli GPU yükseltme rotasını sınırlayabilir.'),
      storage: inTr('Storage can show up as stutter or slow asset streaming.', 'Depolama sorunu takılma veya yavaş içerik yükleme gibi görünebilir.'),
      cooling: inTr('Thermals can hide as a CPU or GPU bottleneck.', 'Sıcaklık sorunu CPU veya GPU darboğazı gibi görünebilir.'),
      none: inTr('No single paid upgrade clearly dominates yet.', 'Henüz tek bir ücretli yükseltme net şekilde öne çıkmıyor.')
    }[bottleneckKey];

    const priorityNote = priorityKey === 'high'
      ? inTr('Fix the blocker or validate the upgrade soon.', 'Engeli çöz veya yükseltmeyi yakında doğrula.')
      : priorityKey === 'medium'
        ? inTr('Worth investigating after free fixes.', 'Ücretsiz düzeltmelerden sonra araştırmaya değer.')
        : inTr('Optimize first. Buying can wait.', 'Önce optimize et. Satın alma bekleyebilir.');

    const scoreNote = systemScore >= 85
      ? inTr('Healthy baseline', 'Sağlıklı temel')
      : systemScore >= 70
        ? inTr('Some targeted work needed', 'Hedefli iyileştirme gerekli')
        : inTr('Clear limiter detected', 'Net sınırlayıcı tespit edildi');

    return {
      systemScore,
      scoreNote,
      bottleneckKey,
      bottleneckLabel: bottleneckLabels[bottleneckKey],
      issueNote,
      priorityKey,
      priorityLabel: priorityLabels[priorityKey],
      priorityNote,
      confidenceKey,
      confidenceLabel: confidenceLabels[confidenceKey],
      confidenceNote,
      limitedInfo
    };
  }

  function buildDiagnosticWhy(diagnostics) {
    if (diagnostics.limitedInfo) {
      return inTr(
        'This diagnosis uses the parts you selected, but one or more details are uncertain. Treat it as a direction: apply the free checks first, then validate the bottleneck before buying.',
        'Bu tanı seçtiğin parçalara göre oluşturuldu, fakat bir veya daha fazla bilgi belirsiz. Bunu rota olarak kullan: önce ücretsiz kontrolleri uygula, sonra satın almadan önce darboğazı doğrula.'
      );
    }
    if (diagnostics.bottleneckKey === 'gpu') {
      return inTr(
        gpuName + ' is the likely limiter at ' + resLabel + ' / ' + hz + 'Hz for ' + gameLabel + '. Your CPU looks less urgent, so a GPU path makes more sense after driver and temperature checks.',
        gpuName + ', ' + resLabel + ' / ' + hz + 'Hz seviyesinde ' + gameLabel + ' için muhtemel sınırlayıcı. CPU daha az acil görünüyor; sürücü ve sıcaklık kontrolünden sonra GPU rotası daha mantıklı.'
      );
    }
    if (diagnostics.bottleneckKey === 'cpu') {
      return inTr(
        cpuName + ' may be holding back frame consistency while ' + gpuName + ' still has usable headroom. That makes a CPU-focused path more sensible than buying a stronger GPU first.',
        cpuName + ' kare tutarlılığını sınırlıyor olabilir; ' + gpuName + ' tarafında hâlâ kullanılabilir pay var. Bu yüzden önce daha güçlü GPU almak yerine CPU odaklı rota daha mantıklı.'
      );
    }
    if (diagnostics.bottleneckKey === 'ram') {
      return inTr(
        'Your RAM setup can affect stutter and 1% lows more than average FPS. Fix capacity, speed, or channel mode before judging the CPU and GPU.',
        'RAM kurulumu ortalama FPS yerine daha çok takılma ve %1 düşük değerlerini etkileyebilir. CPU ve GPU kararı vermeden önce kapasite, hız veya kanal modunu düzelt.'
      );
    }
    if (diagnostics.bottleneckKey === 'psu') {
      return inTr(
        'The PSU does not add FPS directly, but it can decide whether a GPU upgrade is safe. That is why power readiness comes before buying a stronger graphics card.',
        'PSU doğrudan FPS eklemez, fakat GPU yükseltmesinin güvenli olup olmadığını belirler. Bu yüzden daha güçlü ekran kartından önce güç hazırlığı gelir.'
      );
    }
    if (diagnostics.bottleneckKey === 'storage') {
      return inTr(
        'Your symptoms and game profile can be affected by storage speed. Moving games away from an HDD may reduce loading hitches before any CPU or GPU purchase.',
        'Belirtilerin ve oyun profilin depolama hızından etkilenebilir. Oyunları HDD yerine SSD/NVMe diske almak, CPU veya GPU almadan önce takılmaları azaltabilir.'
      );
    }
    if (diagnostics.bottleneckKey === 'cooling') {
      return inTr(
        'Cooling can make good hardware behave like weak hardware. Check temperatures under load before replacing a CPU or GPU.',
        'Soğutma sorunu iyi donanımı zayıf donanım gibi gösterebilir. CPU veya GPU değiştirmeden önce yük altında sıcaklıkları kontrol et.'
      );
    }
    return inTr(
      'Your selected CPU, GPU, memory and display target look reasonably balanced. The safest move is to optimize, measure, then rerun the result with better evidence.',
      'Seçtiğin CPU, GPU, bellek ve ekran hedefi makul dengede görünüyor. En güvenli rota optimize etmek, ölçmek ve daha net veriyle sonucu tekrar çalıştırmak.'
    );
  }

  function buildActionPlan(diagnostics) {
    const steps = [];
    const add = text => {
      if (steps.length < 5 && !steps.includes(text)) steps.push(text);
    };

    if (psuDependencyActive) {
      add(psuDependencyAction);
    }
    add(inTr('Set Windows power mode correctly and confirm the monitor refresh rate.', 'Windows güç modunu doğru ayarla ve monitör yenileme hızını doğrula.'));

    if (diagnostics.bottleneckKey === 'ram' || showMemory) {
      add(inTr('Verify RAM speed and channel mode with CPU-Z; enable XMP/EXPO or fix dual-channel if needed.', 'CPU-Z ile RAM hızı ve kanal modunu doğrula; gerekiyorsa XMP/EXPO aç veya çift kanalı düzelt.'));
    }
    if (diagnostics.bottleneckKey === 'gpu' || showGPU) {
      add(inTr('Update GPU drivers, then check GPU usage and temperature during a real game.', 'GPU sürücülerini güncelle, sonra gerçek oyunda GPU kullanımı ve sıcaklığını kontrol et.'));
    }
    if (diagnostics.bottleneckKey === 'cpu' || showCPU) {
      add(inTr('Update chipset drivers and check CPU temperature, clocks, and usage under load.', 'Yonga seti sürücülerini güncelle; yük altında CPU sıcaklığı, frekansı ve kullanımını kontrol et.'));
    }
    if (diagnostics.bottleneckKey === 'storage' || hddGameDrive) {
      add(inTr('Move the target game to an SSD or NVMe drive if it is currently on an HDD.', 'Oyun HDD üzerindeyse SSD veya NVMe diske taşı.'));
    }
    if (diagnostics.bottleneckKey === 'cooling' || throttleLoss.show || isLaptop) {
      add(inTr('Check temperatures under load and clean airflow before buying hardware.', 'Donanım almadan önce yük altında sıcaklıkları ve kasa hava akışını kontrol et.'));
    }
    if (diagnostics.bottleneckKey === 'psu') {
      add(inTr('Confirm PSU wattage and quality before any GPU upgrade.', 'Her GPU yükseltmesinden önce PSU watt değerini ve kalitesini doğrula.'));
    }

    if (!singleChannelPreBuyBlocker && best.score > 2 && !(isLaptop && (best.key === 'gpu' || best.key === 'cpu' || best.key === 'psu'))) {
      const targetName = (PART_META[best.key] || PART_META.none).name;
      add(inTr('Upgrade ' + targetName + ' only after the free checks still point there.', targetName + ' yükseltmesini yalnızca ücretsiz kontroller hâlâ orayı işaret ediyorsa yap.'));
    }

    add(inTr('Re-test performance and rerun UpgradePilot with the new observations.', 'Performansı tekrar test et ve yeni gözlemlerle UpgradePilot sonucunu yeniden çalıştır.'));
    return steps.slice(0, 5);
  }

  let wasteLevel, wasteClass, wasteSub;
  if (singleChannelPreBuyBlocker) {
    wasteLevel=inTr('HIGH','YÜKSEK'); wasteClass='c-whi'; wasteSub=inTr('Single-channel RAM should be fixed first','Önce tek kanal RAM sorunu çözülmeli');
  } else if (isLaptop && (best.key === 'gpu' || best.key === 'cpu' || best.key === 'psu')) {
    wasteLevel=inTr('HIGH','YÜKSEK'); wasteClass='c-whi'; wasteSub=inTr('Laptop CPU/GPU upgrades are usually impractical','Laptop CPU/GPU yükseltmesi genelde pratik değildir');
  } else if (best.key === 'gpu' && cpuSc < 5 && gpuSc >= 7) {
    wasteLevel=inTr('HIGH','YÜKSEK');   wasteClass='c-whi'; wasteSub=inTr('CPU may bottleneck a stronger GPU','CPU daha güçlü bir GPU’yu sınırlayabilir');
  } else if (best.key === 'gpu' && (psuDanger || (psuW>0 && psuBlockUpgr))) {
    wasteLevel=inTr('HIGH','YÜKSEK');   wasteClass='c-whi'; wasteSub=inTr('PSU upgrade required first','Önce PSU yükseltmesi gerekiyor');
  } else if (best.key === 'cpu' && gpuSc < 4) {
    wasteLevel=inTr('MEDIUM','ORTA'); wasteClass='c-wmd'; wasteSub=inTr('GPU also needs attention','GPU tarafı da dikkat istiyor');
  } else if (best.key === 'ramspd') {
    wasteLevel=inTr('MEDIUM','ORTA'); wasteClass='c-wmd'; wasteSub=inTr('Verify speed with CPU-Z first — may be free','Önce CPU-Z ile hızı doğrula — çözüm ücretsiz olabilir');
  } else if (sc <= 2) {
    wasteLevel=inTr('HIGH','YÜKSEK');   wasteClass='c-whi'; wasteSub=inTr('No upgrade is high-value right now','Şu an yüksek değerli yükseltme görünmüyor');
  } else {
    wasteLevel=inTr('LOW','DÜŞÜK');    wasteClass='c-wlo'; wasteSub=inTr('Upgrade appears well-targeted','Yükseltme hedefi mantıklı görünüyor');
  }

  /* ============================================================
     08 — FINAL DECISION
     ============================================================ */
  let verdictLabel, verdictClass;
  if (best.score >= 6)      { verdictLabel=inTr('Upgrade Now','Şimdi Yükselt');        verdictClass='vb-upgrade'; }
  else if (best.score >= 3) { verdictLabel=inTr('Consider Upgrading','Yükseltme Düşünülebilir'); verdictClass='vb-maybe'; }
  else                      { verdictLabel=inTr('Optimize First','Önce Optimize Et');     verdictClass='vb-hold'; }

  const FINAL_SENT = {
    gpu:    inTr('Upgrade your GPU first. Start around the ' + gpuTargetTierText() + ', then validate temperatures, PSU headroom, and benchmarks before buying.','Önce GPU yükselt. ' + gpuTargetTierText() + ' civarından başla; satın almadan önce sıcaklık, PSU payı ve benchmark ile doğrula.'),
    cpu:    inTr('Upgrade your CPU next. Target the ' + cpuTargetTierText() + ', then confirm with HWiNFO64 before buying.','Sonraki yükseltme CPU olmalı. ' + cpuTargetTierText() + ' hedefle; satın almadan önce HWiNFO64 ile doğrula.'),
    ramcap: inTr('Upgrade your RAM capacity — one of the cheapest high-impact fixes.','RAM kapasitesini yükselt — genelde en ucuz ve etkili çözümlerden biri.'),
    ramspd: inTr('Verify RAM speed with CPU-Z first. If XMP/EXPO is off, enabling it is free.','Önce CPU-Z ile RAM hızını doğrula. XMP/EXPO kapalıysa açmak ücretsiz.'),
    psu:    inTr('Upgrade your PSU before anything else. Your upgrade path depends on it.','Her şeyden önce PSU yükselt. Yükseltme yolun buna bağlı.'),
  };
  const FINAL_CLS = {gpu:'fb-upgrade',cpu:'fb-upgrade',ramcap:'fb-upgrade',ramspd:'fb-maybe',psu:'fb-hold'};
  const FINAL_ICO = {gpu:'&#10003;',cpu:'&#10003;',ramcap:'&#10003;',ramspd:'&#126;',psu:'&#33;'};

  let finalSent, finalCls, finalIco;
  // Hard pre-buy blockers: free configuration fixes or laptop limitations first.
  if (singleChannelPreBuyBlocker) {
    finalSent = inTr('Do not buy parts yet. Fix or verify dual-channel RAM first, then rerun the analysis.','Şimdilik parça alma. Önce RAM’in çift kanal çalıştığını doğrula/düzelt, sonra analizi tekrar çalıştır.');
    finalCls  = 'fb-hold'; finalIco = '&#9135;';
  } else if (psuDependencyActive) {
    finalSent = psuW > 0
      ? inTr('Do not buy a stronger GPU yet. Resolve PSU readiness first, then rerun the recommendation.', 'Henuz daha guclu GPU alma. Once PSU hazirligini coz, sonra oneriyi tekrar calistir.')
      : inTr('Do not choose a GPU upgrade yet. Enter PSU wattage and verify PSU quality first.', 'Henuz GPU yukseltmesi secme. Once PSU watt degerini gir ve PSU kalitesini dogrula.');
    finalCls  = 'fb-hold'; finalIco = '&#9135;';
  } else if (isLaptop && best.score <= 2) {
    finalSent = inTr('Optimize the laptop first: clean cooling, check throttling, verify power mode, then consider RAM or SSD only if the tests point there.','Önce laptopu optimize et: soğutmayı temizle, throttling kontrol et, güç modunu doğrula; testler işaret ederse sadece RAM veya SSD düşün.');
    finalCls  = 'fb-hold'; finalIco = '&#9135;';
  } else if (best.score <= 2) {
    finalSent = inTr('Optimize first. Work through the free fixes in Section 02 and validate with benchmarks in Section 03 before spending money.','Önce optimize et. Para harcamadan önce 02. bölümdeki ücretsiz kontrolleri uygula ve 03. bölümde benchmark ile doğrula.');
    finalCls  = 'fb-hold'; finalIco = '&#9135;';
  } else if (budgetN === 0) {
    finalSent = inTr('No budget entered yet. Use the price tiers above to compare options, then enter a real budget for a buy/no-buy verdict.','Henuz butce girilmedi. Once yukaridaki fiyat katmanlariyla secenekleri karsilastir, sonra net satin al/alma karari icin gercek butce gir.');
    finalCls  = 'fb-maybe'; finalIco = '&#126;';
  } else {
    finalSent = FINAL_SENT[best.key] || inTr('Optimize first, then reconsider.','Önce optimize et, sonra tekrar değerlendir.');
    finalCls  = FINAL_CLS[best.key] || 'fb-hold';
    finalIco  = FINAL_ICO[best.key] || '&#126;';
  }

  if (isLaptop && best.score <= 2 && finalCls === 'fb-hold') {
    finalSent = inTr('Optimize the laptop first. Check cooling, throttling, and power mode before considering RAM or SSD.', 'Once laptopu optimize et. RAM veya SSD dusunmeden once sogutma, throttling ve guc modunu kontrol et.');
    finalIco = '&#8594;';
  } else if (best.score <= 2 && finalCls === 'fb-hold') {
    finalIco = '&#8594;';
  }

  const bandDesc = isLaptop ? null : priceKey ? PRICE_USD[priceKey] : null;

  function marketplaceUrl(query) {
    const host = currentLang === 'tr' ? 'https://www.amazon.com.tr/s?k=' : 'https://www.amazon.com/s?k=';
    return host + encodeURIComponent(query);
  }

  function actionLabelFor(kind) {
    return {
      gpu: inTr('Compare best-value GPUs', 'En mantikli GPUlari karsilastir'),
      cpu: inTr('Check CPU upgrade options', 'CPU yükseltme seçeneklerine bak'),
      ram: inTr('Find matched RAM kits', 'Uyumlu RAM kitleri bul'),
      ramcap: inTr('Find matched RAM kits', 'Uyumlu RAM kitleri bul'),
      psu: inTr('Check safe PSU options', 'Guvenli PSU seceneklerine bak'),
      laptop: inTr('Compare laptop options', 'Laptop seceneklerini karsilastir'),
      build: inTr('View Example System', 'Örnek Sistemi Gör'),
      none: inTr('Do the free checks first', 'Önce ücretsiz kontrolleri yap')
    }[kind] || inTr('Compare recommended options', 'Önerilen seçenekleri karşılaştır');
  }

  function buildBuyingAction() {
    const isNoBuy = best.score <= 1 || best.key === 'ramspd';
    const isBuyLaptop = isLaptop;
    const kind = isBuyLaptop ? 'laptop' : isNoBuy ? 'none' : best.key;
    const title = isBuyLaptop
      ? inTr('Recommended system options', 'Önerilen sistem seçenekleri')
      : isNoBuy
      ? inTr('Best move: verify before buying', 'En iyi adım: almadan önce doğrula')
      : inTr('Recommended next action', 'Önerilen sonraki adım');
    const focus = isBuyLaptop
      ? inTr('Laptop Options', 'Laptop Seçenekleri')
      : best.key === 'gpu'
        ? meta.name + ' — ' + gpuTargetTierText()
        : best.key === 'cpu'
          ? meta.name + ' — ' + cpuTargetTierText()
          : meta.name;
    const copy = isNoBuy
      ? inTr('UpgradePilot does not see a strong paid upgrade yet. Run the validation checks, apply the free fixes, then rerun this result with fresh observations.',
             'UpgradePilot su an guclu bir ucretli yukseltme gormuyor. Dogrulama kontrollerini yap, ucretsiz duzeltmeleri uygula, sonra yeni gozlemlerle tekrar calistir.')
      : inTr('Start with this comparison lane. It keeps the recommendation tied to your diagnosis instead of sending you into random product listings.',
             'Bu karsilastirma araligindan basla. Boylece rastgele urun listelerine girmek yerine tavsiye analiz sonucuna bagli kalir.');
    const queryByKind = {
      gpu: gpuTargetTierText().replace(/ \/ /g, ' ').replace('class', 'graphics card'),
      cpu: cpuKey.startsWith('r') ? 'Ryzen 5 5600 Ryzen 7 5700X3D processor' : 'i5 12400F Ryzen 5 5600 CPU motherboard',
      ramcap: '2x16GB ' + ramType.toUpperCase() + ' dual channel kit',
      psu: psuRecWatts + ' 80+ Gold power supply',
      laptop: 'gaming laptop RTX 4060 16GB SSD',
      build: 'Ryzen 5 5600 RX 6600 gaming pc build'
    };
    const query = queryByKind[kind] || queryByKind[best.key] || '';
    const price = isBuyLaptop && budgetN > 0
      ? formatRangeForCurrency(Math.max(350, budgetUSD * .82), budgetUSD * 1.08, 'retail')
      : bandDesc
      ? (currency === 'try' ? inTr('TRY range below', 'TL araligi asagida') : formatRangeForCurrency(bandDesc[0], bandDesc[1], 'value'))
      : inTr('Price varies', 'Fiyat degisir');
    const link = ((!isNoBuy && query) || (isBuyLaptop && budgetN > 0))
      ? '<a class="buying-action-btn" href="' + marketplaceUrl(query) + '" target="_blank" rel="noopener noreferrer">' + actionLabelFor(kind) + '</a>'
      : '<button type="button" class="buying-action-btn buying-action-btn-muted" disabled>' + actionLabelFor('none') + '</button>';

    return '<div class="buying-action-card">' +
      '<div class="buying-action-main">' +
        '<div class="buying-kicker">' + title + '</div>' +
        '<div class="buying-title">' + focus + '</div>' +
        '<div class="buying-copy">' + copy + '</div>' +
        '<div class="buying-trust-row">' +
          '<span>' + inTr('Free fixes first', 'Önce ücretsiz çözümler') + '</span>' +
          '<span>' + (isLaptop
            ? inTr('Power mode checked', 'Güç modu kontrol edildi')
            : psuDependencyActive
              ? inTr('PSU blocks GPU path', 'PSU GPU rotasini sinirliyor')
            : inTr('PSU considered', 'PSU hesaba katildi')) + '</span>' +
          '<span>' + inTr('Waste risk checked', 'Israf riski kontrol edildi') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="buying-action-side">' +
        '<div class="buying-price">' + price + '</div>' +
        link +
        '<div class="affiliate-note">' + inTr('UpgradePilot may earn a commission from qualifying purchases. Recommendations stay based on your diagnosis.',
          'UpgradePilot uygun satin alimlardan komisyon kazanabilir. Tavsiyeler analiz sonucuna bagli kalir.') + '</div>' +
      '</div>' +
    '</div>';
  }

  const diagnostics = buildResultDiagnostics();
  diagnostics.issueNote = {
    cpu: inTr('Frame consistency risk.', 'Kare tutarliligi riski.'),
    gpu: inTr('Graphics limit likely.', 'Grafik siniri olasi.'),
    ram: inTr('Capacity, speed, or channel issue.', 'Kapasite, hiz veya kanal sorunu.'),
    psu: inTr('Power may block GPU upgrades.', 'Güç, GPU yükseltmesini sınırlayabilir.'),
    storage: inTr('Stutter or streaming risk.', 'Stutter veya asset akisi riski.'),
    cooling: inTr('Thermals may hide the real limit.', 'Sicaklik gercek siniri saklayabilir.'),
    none: inTr('No clear paid upgrade yet.', 'Henüz net ücretli yükseltme yok.'),
  }[diagnostics.bottleneckKey];
  diagnostics.priorityNote = diagnostics.priorityKey === 'high'
    ? inTr('Act before buying.', 'Almadan once aksiyon al.')
    : diagnostics.priorityKey === 'medium'
      ? inTr('Check after free fixes.', 'Ucretsiz duzeltmelerden sonra kontrol et.')
      : inTr('Buying can wait.', 'Satın alma bekleyebilir.');
  // confidenceNote is already set correctly during analysis above
  let diagnosticWhyText = buildDiagnosticWhy(diagnostics);
  diagnosticWhyText = {
    gpu: inTr('Your target leans GPU-heavy. Update drivers and check temperatures first, then compare the ' + gpuTargetTierText() + ' instead of random GPU listings.', 'Hedefin GPU ağırlıklı. Önce sürücüyü güncelle ve sıcaklığı kontrol et; sonra rastgele GPU listeleri yerine ' + gpuTargetTierText() + ' aralığını karşılaştır.'),
    cpu: inTr('Your CPU may be limiting frame consistency. Check chipset drivers, clocks, and temperatures first.', 'CPU kare tutarlılığını sınırlayabilir. Önce yonga seti sürücüsünü, frekansları ve sıcaklıkları kontrol et.'),
    ram: inTr('RAM can cause stutter before average FPS looks bad. Verify speed, capacity, and channel mode first.', 'RAM, ortalama FPS düşmeden takılma yaratabilir. Önce hız, kapasite ve kanal modunu doğrula.'),
    psu: inTr('Power readiness comes before a stronger GPU. Confirm PSU wattage and quality before buying.', 'Daha güçlü GPU’dan önce güç hazırlığı gelir. Almadan önce PSU watt değerini ve kalitesini doğrula.'),
    storage: inTr('Storage can cause loading hitches and stutter. Move the game to SSD/NVMe before replacing CPU or GPU.', 'Depolama yukleme takilmasi ve stutter yaratabilir. CPU/GPU degistirmeden once oyunu SSD/NVMe diske tasi.'),
    cooling: inTr('Thermals can make good parts behave weak. Check load temperatures before replacing hardware.', 'Sıcaklık iyi parçaları zayıf gibi gösterebilir. Donanım değiştirmeden önce yük sıcaklıklarını kontrol et.'),
    none: inTr('No paid upgrade clearly wins yet. Optimize, measure, then rerun with better evidence.', 'Henüz net kazanan ücretli yükseltme yok. Optimize et, ölç, daha iyi veriyle tekrar çalıştır.'),
  }[diagnostics.bottleneckKey] || diagnosticWhyText;
  const actionPlan = buildActionPlan(diagnostics);

  function buildPolishedFreeChecks() {
    const items = [];
    checks.forEach(item => {
      if (!items.some(existing => existing.t === item.t)) items.push(item);
    });
    return items;
  }

  /* ============================================================
     RENDER TO DOM
     ============================================================ */
  const _s = (id, val) => { const e = el(id); if (e) e.textContent = val; };
  const _h = (id, val) => { const e = el(id); if (e) e.innerHTML  = val; };
  const _c = (id, cls)  => { const e = el(id); if (e) e.className  = cls; };

  _s('vbadge', verdictLabel);
  _c('vbadge', 'vbadge ' + verdictClass);

  _s('system-score-value', diagnostics.systemScore);
  _s('system-score-note',  diagnostics.scoreNote);

  _s('main-bottleneck-note',    diagnostics.issueNote);
  _s('upgrade-priority-value',  diagnostics.priorityLabel);
  _s('upgrade-priority-note',   diagnostics.priorityNote);
  _s('estimated-gain-value',    gain.label);
  _s('estimated-gain-note',     gain.note);
  _s('confidence-value',        diagnostics.confidenceLabel);
  _s('confidence-note',         diagnostics.confidenceNote);
  el('diagnostic-summary')?.setAttribute('data-priority', diagnostics.priorityKey);
  el('diagnostic-summary')?.setAttribute('data-confidence', diagnostics.confidenceKey);
  renderResultArtwork(el('result-part-artwork'), !isLaptop && (best.key === 'cpu' || best.key === 'gpu') ? best.key : '');
  _s('result-analysis-why', diagnosticWhyText);
  _h('result-analysis-verify', benches
    .flatMap(bench => bench.items || [])
    .slice(0, 3)
    .map(item => '<li>' + item + '</li>')
    .join(''));
  _h('result-analysis-next', actionPlan
    .slice(0, 3)
    .map(item => '<li>' + item + '</li>')
    .join(''));

  // 01 Diagnosis
  _s('diag-pill', diagLabel);
  _c('diag-pill', 'diag-pill ' + diagClass);
  _s('diag-text', diagText);

  // 02 Free Fixes
  let lastGrp='', clHTML='';
  const freeChecks = buildPolishedFreeChecks();
  freeChecks.forEach((c,i) => {
    if (c.g !== lastGrp) {
      clHTML += '<div class="cl-grp">' + groupLabel(c.g) + '</div>';
      lastGrp = c.g;
    }
    clHTML += '<div class="ci" id="ci-' + i + '" data-check-id="' + i + '"><div class="cbox"></div><span class="ctxt">' + c.t + '</span></div>';
  });
  _h('checklist', clHTML);
  updateFreeBoostProgress();

  // 03 Benchmarks
  let bHTML = '';
  benches.forEach(b => {
    bHTML += '<div style="margin-bottom:.8rem">';
    if (b.warn) {
      bHTML += '<div class="bench-warning">' + b.items[0] + '</div>';
    } else {
      bHTML += '<div class="bench-grp-lbl">' + groupLabel(b.g) + '</div>';
      b.items.forEach(item => {
        bHTML += '<div class="bench-item"><div class="bdot"></div><span>' + item + '</span></div>';
      });
    }
    bHTML += '</div>';
  });
  _h('bench-list', bHTML);

  // 04 Best upgrade
  const meta = singleChannelPreBuyBlocker
    ? PART_META.ramconfig
    : ((best.score <= 1) ? PART_META.none : PART_META[best.key]);
  const visualPart = best.key === 'ramcap' || best.key === 'ramspd' ? 'ram' : (best.key || 'system');
  setVirtualPcPart(best.score <= 1 ? 'system' : visualPart, best.score <= 1 ? inTr('Current rig','Mevcut sistem') : meta.name);
  _h('uicon',   meta.icon);
  _c('uicon',   'uicon ' + meta.icls);
  _s('uname',   isLaptop ? inTr('Laptop Options', 'Laptop Seçenekleri') : meta.name);
  _s('usub',    isLaptop
    ? inTr('Compare complete laptops instead of internal desktop-style upgrades', 'Masaüstü tipi iç parça yükseltmeleri yerine komple laptopları karşılaştır')
    : meta.sub);
  _s('why-box', diagnosticWhyText);
  _h('action-plan-list', actionPlan.map((step, index) =>
    '<li><span class="action-step-num">' + (index + 1) + '</span><span>' + step + '</span></li>'
  ).join(''));
  const buyingActionEl = el('buying-action');
  if (buyingActionEl) buyingActionEl.innerHTML = buildBuyingAction();
  const upgradePathCards = buildUpgradePath();
  const upgradePathEl = el('upgrade-path');
  const upgradePathLabel = document.querySelector('.result-upgrade-section .path-label');
  if (upgradePathLabel) upgradePathLabel.classList.toggle('is-hidden', upgradePathCards.length === 0);
  if (upgradePathEl) upgradePathEl.classList.toggle('is-hidden', upgradePathCards.length === 0);
  if (upgradePathEl) upgradePathEl.innerHTML = upgradePathCards.map(card =>
    '<div class="path-card">' +
      '<div class="path-kicker">' + card.k + '</div>' +
      '<div class="path-title">' + card.t + '</div>' +
      '<div class="path-copy">' + card.c + '</div>' +
    '</div>'
  ).join('');
  // Render specific part/GPU recommendations at top of results (Section 02)
  const upgradePicksEl = el('upgrade-picks');
  const upgradePicksHTML = buildExamplePartCards();
  if (upgradePicksEl) upgradePicksEl.innerHTML = upgradePicksHTML;
  const tierSectionEl = document.querySelector('.res-tier-section');
  if (tierSectionEl) tierSectionEl.classList.toggle('is-hidden', !upgradePicksHTML.trim());
  const upgradeOptionsLabel = isLaptop
    ? inTr('Laptop Options', 'Laptop Seçenekleri')
    : inTr('Validated upgrade paths', 'Doğrulanmış yükseltme yolları');
  const upgradeOptionsLabelEl = document.querySelector('.res-tier-label');
  if (upgradeOptionsLabelEl) upgradeOptionsLabelEl.textContent = upgradeOptionsLabel;

  // ── New result page renders ───────────────────────────────────────────

  // Product name — big hero title
  const productNameEl = el('res-product-name');
  if (productNameEl) productNameEl.textContent = isLaptop ? inTr('Laptop Options', 'Laptop Seçenekleri') : (meta.name || '—');

  // Product description
  const productDescEl = el('res-product-desc');
  if (productDescEl) productDescEl.textContent = isLaptop
    ? inTr('Diagnosis: ', 'Teşhis: ') + meta.name + '. ' + diagnosticWhyText
    : (diagnosticWhyText || '');

  // Price from bandDesc
  const priceEl = el('res-price');
  const priceRowEl = document.querySelector('.res-price-row');
  const showPrice = isLaptop ? budgetN > 0 : (best.score > 1 && !singleChannelPreBuyBlocker);
  if (priceRowEl) priceRowEl.classList.toggle('is-hidden', !showPrice);
  if (priceEl) {
    if (isLaptop && budgetN > 0) {
      priceEl.textContent = formatRangeForCurrency(Math.max(350, budgetUSD * .82), budgetUSD * 1.08, 'retail');
    } else if (!bandDesc) {
      priceEl.textContent = inTr('Price varies', 'Fiyat değişir');
    } else if (currency === 'try') {
      priceEl.textContent = formatRangeForCurrency(bandDesc[0], bandDesc[1], 'retail');
    } else {
      priceEl.textContent = formatRangeForCurrency(bandDesc[0], bandDesc[1], 'retail');
    }
  }

  // Rec badge visibility
  const recBadge = el('res-rec-badge');
  if (recBadge) recBadge.style.display = best.score <= 1 ? 'none' : '';
  const recBadgeLabel = recBadge?.querySelector('span:last-child');
  if (recBadgeLabel) recBadgeLabel.textContent = isLaptop
    ? inTr('Laptop Options', 'Laptop Seçenekleri')
    : inTr('Recommended upgrade', 'Önerilen yükseltme');

  // Performance delta bars
  const perfDeltaEl = el('res-perf-delta');
  const showFpsDelta = best.score > 1 && (best.key === 'gpu' || best.key === 'cpu');
  if (perfDeltaEl) perfDeltaEl.classList.toggle('is-hidden', !showFpsDelta);
  if (perfDeltaEl && showFpsDelta) {
    const gainLow  = parseInt((gain.label || '0').replace(/[^0-9]/,'')) || 0;
    const gainHigh = parseInt((gain.label || '0').split('–').pop()) || gainLow;
    const gainMid  = Math.round((gainLow + gainHigh) / 2);
    const currentPct = Math.round(100 / (1 + gainMid / 100));
    const upgradePct = 100;
    const resStr = res === '4k' ? '4K' : res === '1440' ? '1440p' : '1080p';
    perfDeltaEl.innerHTML =
      '<div class="rpd-title">' +
        inTr('PERFORMANCE DELTA (' + resStr + ')', 'PERFORMANS FARKI (' + resStr + ')') +
        '<span class="rpd-path">' + meta.name + ' upgrade</span>' +
      '</div>' +
      '<div class="rpd-row rpd-avg">' +
        '<div class="rpd-row-header">' +
          '<span class="rpd-row-label">' + inTr('AVERAGE FRAME RATE', 'ORTALAMA KARE HIZI') + '</span>' +
          '<span class="rpd-gain rpd-gain-green">+' + gainMid + '% ' + inTr('UPLIFT', 'ARTIŞ') + '</span>' +
        '</div>' +
        '<div class="rpd-bar-row"><span class="rpd-bar-label">' + inTr('CURRENT', 'MEVCUT') + '</span>' +
          '<div class="rpd-bar-wrap"><div class="rpd-bar rpd-bar-current" style="width:' + currentPct + '%"></div>' +
          '<span class="rpd-bar-val">~' + Math.round(60 * (1 + gainMid/200)) + ' FPS</span></div></div>' +
        '<div class="rpd-bar-row"><span class="rpd-bar-label">' + inTr('UPGRADE', 'YÜKSELTME') + '</span>' +
          '<div class="rpd-bar-wrap"><div class="rpd-bar rpd-bar-upgrade" style="width:' + upgradePct + '%"></div>' +
          '<span class="rpd-bar-val">~' + Math.round(60 * (1 + gainMid/100) * (1 + gainMid/200)) + ' FPS</span></div></div>' +
      '</div>' +
      '<div class="rpd-row rpd-lows">' +
        '<div class="rpd-row-header">' +
          '<span class="rpd-row-label">' + inTr('1% LOWS (STUTTER CONTROL)', '1% LOW (STUTTER KONTROLÜ)') + '</span>' +
          '<span class="rpd-gain rpd-gain-blue">+' + Math.round(gainMid * 1.3) + '% ' + inTr('STABILITY', 'STAB.') + '</span>' +
        '</div>' +
        '<div class="rpd-bar-row"><span class="rpd-bar-label">' + inTr('CURRENT', 'MEVCUT') + '</span>' +
          '<div class="rpd-bar-wrap"><div class="rpd-bar rpd-bar-current" style="width:' + Math.round(currentPct * 0.8) + '%"></div>' +
          '<span class="rpd-bar-val">~' + Math.round(40 * (1 + gainMid/200)) + ' FPS</span></div></div>' +
        '<div class="rpd-bar-row"><span class="rpd-bar-label">' + inTr('UPGRADE', 'YÜKSELTME') + '</span>' +
          '<div class="rpd-bar-wrap"><div class="rpd-bar rpd-bar-upgrade" style="width:' + Math.round(upgradePct * 0.85) + '%"></div>' +
          '<span class="rpd-bar-val">~' + Math.round(40 * (1 + gainMid/100)) + ' FPS</span></div></div>' +
      '</div>';
  } else if (perfDeltaEl) {
    perfDeltaEl.innerHTML = '';
  }

  // Installation roadmap
  const roadmapEl = el('res-install-roadmap');
  if (roadmapEl) {
    const steps = [];
    if (best.key === 'gpu') {
      steps.push({ n:'01', t: inTr('Acquire Hardware', 'Donanım Al'), d: inTr('Purchase ' + meta.name + ' through a validated vendor.', meta.name + ' al.') });
      steps.push({ n:'02', t: inTr('PSU Verification', 'PSU Doğrulama'), d: inTr('Ensure your PSU has the required PCIe power leads.', 'PSU\'nun gerekli PCIe güç bağlantılarına sahip olduğunu doğrula.') });
      steps.push({ n:'03', t: inTr('Clean Driver Install', 'Temiz Sürücü Kurulumu'), d: inTr('Use DDU to wipe old drivers before the physical swap.', 'Fiziksel değişimden önce eski sürücüleri DDU ile temizle.') });
    } else if (best.key === 'cpu') {
      steps.push({ n:'01', t: inTr('Check BIOS Support', 'BIOS Desteğini Kontrol Et'), d: inTr('Confirm your motherboard supports the target CPU.', 'Anakartının hedef CPU\'yu desteklediğini doğrula.') });
      steps.push({ n:'02', t: inTr('Update BIOS', 'BIOS Güncelle'), d: inTr('Update BIOS before swapping the CPU.', 'CPU değişiminden önce BIOS\'u güncelle.') });
      steps.push({ n:'03', t: inTr('Install & Test', 'Kur ve Test Et'), d: inTr('Boot, verify detection, run stability test.', 'Aç, algılamayı doğrula, stabilite testi yap.') });
    } else {
      steps.push({ n:'01', t: inTr('Apply Free Fixes First', 'Önce Ücretsiz Düzeltmeleri Uygula'), d: inTr('XMP/EXPO, driver updates, background app cleanup.', 'XMP/EXPO, sürücü güncellemeleri, arka plan uygulama temizliği.') });
      steps.push({ n:'02', t: inTr('Retest', 'Yeniden Test Et'), d: inTr('Run your benchmark again before spending.', 'Para harcamadan önce testini tekrar çalıştır.') });
    }
    roadmapEl.innerHTML = steps.map(s =>
      '<div class="rri-step">' +
        '<span class="rri-num">' + s.n + '</span>' +
        '<div><div class="rri-title">' + s.t + '</div>' +
        '<div class="rri-desc">' + s.d + '</div></div>' +
      '</div>'
    ).join('');
  }

  // Telemetry / health cards
  const healthEl = el('result-health-cards');
  if (healthEl) {
    const items = [
      { label: inTr('CPU UTIL', 'CPU KULL.'), val: cpuSc >= 7 ? inTr('OK','İYİ') : cpuSc >= 5 ? inTr('WATCH','DİKKAT') : inTr('HIGH','YÜKSEK'), hi: cpuSc < 5 },
      { label: inTr('GPU BOTL', 'GPU DAR.'), val: diagnostics.bottleneckKey==='gpu' ? inTr('HIGH','YÜKSEK') : inTr('OK','İYİ'), hi: diagnostics.bottleneckKey==='gpu' },
      { label: inTr('LATENCY', 'GECİKME'), val: ramType==='ddr3' ? inTr('HIGH','YÜKSEK') : channel==='single' ? inTr('WATCH','DİKKAT') : inTr('OK','İYİ'), hi: ramType==='ddr3' },
      { label: inTr('PSU RAIL', 'PSU HATTI'), val: psuDanger ? inTr('RISK','RİSK') : psuW===0 ? inTr('?','?') : inTr('STABLE','STABIL'), hi: psuDanger },
    ];
    healthEl.innerHTML = items.map(item =>
      '<div class="rtg-cell' + (item.hi?' rtg-hi':'') + '">' +
        '<span class="rtg-label">' + item.label + '</span>' +
        '<span class="rtg-val' + (item.hi?' rtg-val-hi':'') + '">' + item.val + '</span>' +
      '</div>'
    ).join('');
  }


  const verdictHeroEl = el('result-verdict-hero');
  if (verdictHeroEl) {
    const priorityColor = diagnostics.priorityKey === 'high' ? 'var(--danger)' : diagnostics.priorityKey === 'medium' ? 'var(--warn)' : 'var(--accent)';
    verdictHeroEl.innerHTML =
      '<div class="rvh-priority" style="color:' + priorityColor + '">' +
        inTr('Upgrade Priority: ', 'Yükseltme Önceliği: ') +
        '<strong>' + diagnostics.priorityLabel.toUpperCase() + '</strong>' +
      '</div>' +
      '<div class="rvh-main">' +
        '<span class="rvh-component">' + meta.name + '</span>' +
        '<span class="rvh-is">' + inTr(' is currently the largest performance constraint.', ' şu an en büyük performans sınırı.') + '</span>' +
      '</div>' +
      '<div class="rvh-gain">' +
        inTr('Estimated Gain: ', 'Tahmini Kazanım: ') + '<strong>' + gain.label + '</strong>' +
      '</div>' +
      '<div class="rvh-action">' +
        inTr('→ Recommended first action: ', '→ Önerilen ilk adım: ') +
        '<strong>' + inTr('Upgrade ' + meta.name + ' before any other component.', meta.name + '\'i diğer bileşenlerden önce yükseltin.') + '</strong>' +
      '</div>';
  }

  // 05 PSU Recommendation (desktop only)
  if (isLaptop) {
    el('psu-result-section')?.classList.add('is-hidden');
    _h('psu-rec-content',
      '<div class="psu-verdict pv-warn"><span class="pvi">~</span><span>' +
      inTr('Laptop selected: desktop PSU and next-GPU-tier recommendations are not evaluated. Check power mode, charger connection, and thermal throttling instead.','Laptop seçildi: masaüstü PSU ve sonraki GPU seviyesi önerisi değerlendirilmez. Bunun yerine güç modu, adaptör bağlantısı ve thermal throttling kontrol edilmeli.') +
      '</span></div>');
  } else {
    el('psu-result-section')?.classList.remove('is-hidden');
    _h('psu-rec-content',
      '<div class="psu-rec-grid">' +
        '<div class="psu-rec-card"><div class="psu-rc-lbl">' + inTr('Your Current PSU','Mevcut PSU') + '</div><div class="psu-rc-val">' + (psuW ? psuW + 'W' : inTr('Unknown','Bilinmiyor')) + '</div></div>' +
        '<div class="psu-rec-card"><div class="psu-rc-lbl">' + inTr('Recommended for Next GPU Tier','Sonraki GPU Seviyesi İçin Öneri') + '</div><div class="psu-rc-val">' + psuRecWatts + ' &middot; ' + psuRecEff + '</div></div>' +
      '</div>' +
      '<div class="psu-verdict ' + psuVerdictCls + '"><span class="pvi">' + (psuVerdictCls==='pv-ok'?'&#10003;':psuVerdictCls==='pv-warn'?'~':'!') + '</span><span>' + psuVerdictText + '</span></div>');
  }

  // 06 Budget & Price
  const tryValueMin = bandDesc ? fmtTry(bandDesc[0] * USD_TRY_ROUGH_RATE * TRY_VALUE_BUFFER * TRY_USED_FACTOR) : 0;
  const tryValueMax = bandDesc ? fmtTry(bandDesc[1] * USD_TRY_ROUGH_RATE * TRY_VALUE_BUFFER) : 0;
  const tryRetailMin = bandDesc ? fmtTry(bandDesc[0] * USD_TRY_ROUGH_RATE * TRY_RETAIL_BUFFER) : 0;
  const tryRetailMax = bandDesc ? fmtTry(bandDesc[1] * USD_TRY_ROUGH_RATE * TRY_RETAIL_BUFFER) : 0;
  const tryMin = tryValueMin;
  const tryMax = tryValueMax;
  const budgetEquivalentUSD = currency === 'try' && budgetN > 0 ? Math.round(budgetUSD) : 0;
  const tryFxHelp =
    '<span class="fx-help" tabindex="0">?' +
      '<span class="fx-popover">' +
        '<span>' + inTr('Rough FX index','Yaklasik kur endeksi') + '</span>' +
        '<span>1 USD ~= ' + USD_TRY_ROUGH_RATE.toFixed(2) + ' TL</span>' +
        '<span>' + inTr('New retail buffer','Sifir magaza payi') + ': +' + Math.round((TRY_RETAIL_BUFFER - 1) * 100) + '%</span>' +
        '<span>' + inTr('Value-market model','Value/ikinci el modeli') + ': ' + Math.round(TRY_USED_FACTOR * 100) + '%</span>' +
      '</span>' +
    '</span>';
  function formatRangeForCurrency(minUsd, maxUsd, mode) {
    if (!isFinite(minUsd) || !isFinite(maxUsd)) return '—';
    if (currency === 'try') {
      const buffer = mode === 'retail' ? TRY_RETAIL_BUFFER : TRY_VALUE_BUFFER;
      const usedFactor = mode === 'value' ? TRY_USED_FACTOR : 1;
      const minTry = fmtTry(minUsd * USD_TRY_ROUGH_RATE * buffer * usedFactor);
      const maxTry = fmtTry(maxUsd * USD_TRY_ROUGH_RATE * buffer);
      if (!isFinite(minTry) || !isFinite(maxTry)) return '—';
      return '~₺' + minTry.toLocaleString('tr-TR') + ' - ₺' + maxTry.toLocaleString('tr-TR');
    }
    if (currency === 'eur') {
      return '~€' + Math.round(minUsd / 1.08) + ' - €' + Math.round(maxUsd / 1.08);
    }
    return '$' + Math.round(minUsd) + ' - $' + Math.round(maxUsd);
  }
  function buildBudgetDiscoveryCards() {
    if (!bandDesc || budgetN > 0) return '';
    const lowMin = Math.max(20, bandDesc[0] * 0.55);
    const lowMax = Math.max(lowMin + 20, bandDesc[0] * 0.95);
    const bestMin = bandDesc[0];
    const bestMax = bandDesc[1];
    const stretchMin = bandDesc[1] * 1.05;
    const stretchMax = bandDesc[1] * 1.45;
    const cards = [
      {
        k: inTr('Low budget target','Dusuk butce hedefi'),
        t: formatRangeForCurrency(lowMin, lowMax, 'value'),
        c: inTr('Mostly used-market or older value parts. Compare condition, warranty, and PSU fit carefully.','Genelde ikinci el veya eski value parcalar. Kondisyon, garanti ve PSU uyumunu dikkatli karsilastir.')
      },
      {
        k: inTr('Best value lane','En mantikli value araligi'),
        t: formatRangeForCurrency(bestMin, bestMax, 'value'),
        c: inTr('The most sensible comparison range for this recommendation before looking at exact products.','Net urun bakmadan once bu tavsiye icin en mantikli karsilastirma araligi.')
      },
      {
        k: inTr('Stretch / new retail','Stretch / sifir magaza'),
        t: formatRangeForCurrency(stretchMin, stretchMax, 'retail'),
        c: inTr('Only consider this if the cheaper tiers are unavailable or the warranty is worth the extra money.','Ucuz katmanlar yoksa veya garanti farki paraya degiyorsa dusun.')
      }
    ];
    return '<div class="discovery-block">' +
      '<div class="discovery-head">' + inTr('No budget entered: compare these tiers first','Butce girilmedi: once bu katmanlari karsilastir') + '</div>' +
      '<div class="discovery-grid">' + cards.map(card =>
        '<div class="discovery-card">' +
          '<div class="path-kicker">' + card.k + '</div>' +
          '<div class="path-title">' + card.t + '</div>' +
          '<div class="path-copy">' + card.c + '</div>' +
        '</div>'
      ).join('') + '</div>' +
    '</div>';
  }
  function buildExamplePartCards() {
    if (isLaptop) return buildLaptopOptionCards();
    if (!bandDesc || best.score <= 1) return '';

    const marketplaceHost = currentLang === 'tr' ? 'https://www.amazon.com.tr/s?k=' : 'https://www.amazon.com/s?k=';
    const marketplaceUrl  = q => marketplaceHost + encodeURIComponent(q);

    // ── GPU: tek primary + AMD/NVIDIA muadili ────────────────────────
    if (best.key === 'gpu') {
      const picks = getCurrentGpuRecommendations({
        budgetUSD,
        resolution: res,
        hz,
        goal,
        currentGpuScore: gpuSc,
        cpuScore: cpuSc,
        psuMaxScore: psuMaxNow,
      });
      const primary = { brand: 'NVIDIA', name: picks.nvidia.name, q: picks.nvidia.query };
      const amdAlt = { brand: 'AMD', name: picks.amd.name, q: picks.amd.query };
      const nvidiaPrice = formatRangeForCurrency(picks.nvidia.price[0], picks.nvidia.price[1], 'retail');
      const amdPrice = formatRangeForCurrency(picks.amd.price[0], picks.amd.price[1], 'retail');
      const whyNote = picks.balanceReason === 'cpu'
        ? inTr('Current-generation target capped to preserve CPU balance and leave room for the platform.', 'Güncel nesil hedef, CPU dengesini korumak ve platforma bütçe bırakmak için sınırlandı.')
        : picks.balanceReason === 'psu'
          ? inTr('Current-generation target capped by the entered PSU wattage.', 'Güncel nesil hedef, girilen PSU watt değerine göre sınırlandı.')
          : inTr('Current-generation target selected from your total budget, resolution, and system balance.', 'Güncel nesil hedef toplam bütçene, çözünürlüğe ve sistem dengesine göre seçildi.');

      return (
        '<div class="epc-wrap">' +
          '<div class="epc-header">' + inTr('Recommended options', 'Önerilen seçenekler') + '</div>' +
          '<div class="epc-pair">' +
            // Primary
            '<div class="epc-card epc-primary">' +
              '<div class="epc-brand epc-nvidia">' + primary.brand + '</div>' +
              '<div class="epc-name">' + primary.name + '</div>' +
              '<div class="epc-price">' + nvidiaPrice + '</div>' +
              '<div class="epc-why">' + whyNote + '</div>' +
              '<a class="epc-cta" href="' + marketplaceUrl(primary.q) + '" target="_blank" rel="noopener noreferrer">' +
                inTr('View listings', 'Listelemelere bak') +
              '</a>' +
            '</div>' +
            // AMD alternative
            '<div class="epc-card epc-alt">' +
              '<div class="epc-brand epc-amd">' + amdAlt.brand + ' ' + inTr('alternative', 'alternatif') + '</div>' +
              '<div class="epc-name">' + amdAlt.name + '</div>' +
              '<div class="epc-price">' + amdPrice + '</div>' +
              '<div class="epc-why">' +
                inTr('Current-generation AMD alternative with competitive raster performance and FSR.', 'Rekabetçi raster performansı ve FSR sunan güncel nesil AMD alternatifi.') +
              '</div>' +
              '<a class="epc-cta epc-cta-alt" href="' + marketplaceUrl(amdAlt.q) + '" target="_blank" rel="noopener noreferrer">' +
                inTr('View listings', 'Listelemelere bak') +
              '</a>' +
            '</div>' +
          '</div>' +
          '<div class="epc-note">' +
            inTr('⚠ Verify PSU wattage and PCIe connector before buying.', '⚠ Satın almadan önce PSU watt ve PCIe konnektörünü doğrula.') +
          '</div>' +
        '</div>'
      );
    }

    // ── CPU: bütçeye göre drop-in veya platform upgrade ─────────────
    if (best.key === 'cpu') {
      const isAm4     = cpuKey.startsWith('r5_3') || cpuKey.startsWith('r5_5') ||
                        cpuKey.startsWith('r7_5') || cpuKey.startsWith('r9_5') ||
                        cpuKey.startsWith('r5_1') || cpuKey.startsWith('r5_2') || cpuKey.startsWith('r7_2');
      const isOldIntel = cpuKey.startsWith('i5_6') || cpuKey.startsWith('i5_7') || cpuKey.startsWith('i5_8') ||
                         cpuKey.startsWith('i5_9') || cpuKey.startsWith('i7_6') || cpuKey.startsWith('i7_7') ||
                         cpuKey.startsWith('i7_8') || cpuKey.startsWith('i7_9');
      const isModernIntel = cpuKey.startsWith('i5_10') || cpuKey.startsWith('i5_11') ||
                            cpuKey.startsWith('i5_12') || cpuKey.startsWith('i7_12') ||
                            cpuKey.startsWith('i5_13') || cpuKey.startsWith('i7_13');

      // Bütçe eşiği: $600+ ise platform yükseltmesi göster
      const canAffordPlatform = budgetUSD >= 600 || budgetN === 0;

      // Drop-in hedef (her zaman göster)
      const dropIn = isAm4
        ? { name: 'Ryzen 5 5700X3D / Ryzen 7 5800X3D', note: inTr('Drop-in if BIOS supports it. Best gaming value on AM4 — no new motherboard needed.', 'BIOS destekliyorsa direkt tak. AM4\'te en iyi oyun değeri — yeni anakart gerekmez.'), q: 'Ryzen 5700X3D 5800X3D', price: formatRangeForCurrency(150, 280, 'retail') }
        : isModernIntel
        ? { name: 'i5-13600K / i7-13700KF', note: inTr('LGA1700 compatible. Verify your motherboard VRM quality before a high-power CPU.', 'LGA1700 uyumlu. Güçlü CPU için anakart VRM kalitesini doğrula.'), q: 'i5-13600K i7-13700KF', price: formatRangeForCurrency(200, 380, 'retail') }
        : { name: 'i5-12400F / i5-13400F', note: inTr('Needs LGA1700 motherboard. Affordable platform jump with strong value.', 'LGA1700 anakart gerektirir. Güçlü değer sunan uygun fiyatlı platform geçişi.'), q: 'i5-12400F i5-13400F', price: formatRangeForCurrency(140, 220, 'retail') };

      // Platform bundle (yüksek bütçede göster)
      const platform = isAm4
        ? { name: 'Ryzen 7 9800X3D + B650 + DDR5', items: ['Ryzen 7 9800X3D', 'B650 motherboard', '2×16 GB DDR5-6000'], note: inTr('Current AM5 X3D platform with a long upgrade runway. Reuse your current GPU temporarily if it scores 5+.', 'Uzun yükseltme ömrü sunan güncel AM5 X3D platformu. GPU puanı 5+ ise mevcut GPU\'nu geçici olarak kullan.'), q: 'Ryzen 9800X3D B650 DDR5 kit', price: formatRangeForCurrency(700, 1050, 'retail') }
        : { name: 'Ryzen 7 9800X3D + B650 + DDR5', items: ['Ryzen 7 9800X3D', 'B650 motherboard', '2×16 GB DDR5-6000'], note: inTr('Current-generation gaming-focused AM5 platform. Budget for the CPU, motherboard, and DDR5 together.', 'Güncel nesil oyun odaklı AM5 platformu. CPU, anakart ve DDR5 için birlikte bütçe ayır.'), q: 'Ryzen 9800X3D B650 DDR5', price: formatRangeForCurrency(700, 1050, 'retail') };

      if (canAffordPlatform) {
        // İki kart: drop-in (sol) + platform upgrade (sağ)
        return (
          '<div class="epc-wrap">' +
            '<div class="epc-header">' + inTr('CPU upgrade options', 'CPU yükseltme seçenekleri') + '</div>' +
            '<div class="epc-pair">' +
              // Drop-in
              '<div class="epc-card">' +
                '<div class="epc-brand" style="color:rgba(105,167,255,.8)">' + inTr('DROP-IN OPTION', 'DIREKT TAK') + '</div>' +
                '<div class="epc-name">' + dropIn.name + '</div>' +
                '<div class="epc-price">' + dropIn.price + '</div>' +
                '<div class="epc-why">' + dropIn.note + '</div>' +
                '<a class="epc-cta" href="' + marketplaceUrl(dropIn.q) + '" target="_blank" rel="noopener noreferrer">' + inTr('View listings', 'Listelemelere bak') + '</a>' +
              '</div>' +
              // Platform bundle
              '<div class="epc-card epc-primary">' +
                '<div class="epc-brand" style="color:rgba(74,222,128,.85)">' + inTr('PLATFORM UPGRADE', 'PLATFORM YÜKSELTMESİ') + '</div>' +
                '<div class="epc-name">' + platform.name + '</div>' +
                '<div class="epc-price">' + platform.price + '</div>' +
                '<div class="epc-items">' + platform.items.map(i => '<span class="epc-item">+ ' + i + '</span>').join('') + '</div>' +
                '<div class="epc-why">' + platform.note + '</div>' +
                '<a class="epc-cta" href="' + marketplaceUrl(platform.q) + '" target="_blank" rel="noopener noreferrer">' + inTr('View listings', 'Listelemelere bak') + '</a>' +
              '</div>' +
            '</div>' +
            '<div class="epc-note">' +
              inTr('⚠ Platform upgrade = new motherboard + RAM + CPU. Budget for all three.', '⚠ Platform yükseltmesi = yeni anakart + RAM + CPU. Üçü için bütçe ayır.') +
            '</div>' +
          '</div>'
        );
      } else {
        // Sadece drop-in
        return (
          '<div class="epc-wrap">' +
            '<div class="epc-header">' + inTr('Recommended CPU target', 'Önerilen CPU hedefi') + '</div>' +
            '<div class="epc-single">' +
              '<div class="epc-name">' + dropIn.name + '</div>' +
              '<div class="epc-price">' + dropIn.price + '</div>' +
              '<div class="epc-why">' + dropIn.note + '</div>' +
              '<a class="epc-cta" href="' + marketplaceUrl(dropIn.q) + '" target="_blank" rel="noopener noreferrer">' + inTr('View listings', 'Listelemelere bak') + '</a>' +
            '</div>' +
            '<div class="epc-note">' +
              inTr('💡 With $600+ budget a full platform upgrade (CPU + motherboard + DDR5) is worth considering.', '💡 $600+ bütçeyle tam platform yükseltmesi (CPU + anakart + DDR5) değerlendirilebilir.') +
            '</div>' +
          '</div>'
        );
      }
    }

    // ── RAM / PSU: tek hedef ─────────────────────────────────────────
    const simpleMap = {
      ramcap: { name: '2×16 GB ' + ramType.toUpperCase() + ' dual-channel kit', note: inTr('Matched kit, not mixed sticks. Dual-channel matters.', 'Eşleştirilmiş kit, karışık değil. Dual-channel önemli.'), q: '2x16GB ' + ramType.toUpperCase() + ' dual channel kit' },
      ramspd: { name: 'XMP/EXPO enable first', note: inTr('Check CPU-Z. If running below rated speed, enable XMP in BIOS — free fix.', 'CPU-Z\'yi kontrol et. Eğer nominal hızın altındaysa BIOS\'ta XMP\'yi aç — ücretsiz.'), q: '' },
      psu:    { name: psuRecWatts + ' 80+ Gold', note: inTr('Choose a reputable brand. Do this before GPU if PSU is the blocker.', 'Güvenilir marka seç. PSU blokajsa GPU\'dan önce bunu yap.'), q: psuRecWatts + ' 80+ Gold power supply' }
    };
    const simple = simpleMap[best.key];
    if (!simple) return '';
    return (
      '<div class="epc-wrap">' +
        '<div class="epc-header">' + inTr('Recommended target', 'Önerilen hedef') + '</div>' +
        '<div class="epc-single">' +
          '<div class="epc-name">' + simple.name + '</div>' +
          '<div class="epc-why">' + simple.note + '</div>' +
          (simple.q ? '<a class="epc-cta" href="' + marketplaceUrl(simple.q) + '" target="_blank" rel="noopener noreferrer">' + inTr('View listings', 'Listelemelere bak') + '</a>' : '') +
        '</div>' +
      '</div>'
    );
  }
  function buildLaptopOptionCards() {
    return buildLaptopSuggestionCards();
  }
  function buildLaptopSuggestionCards() {
    if (!isLaptop) return '';
    const marketplaceHost = currentLang === 'tr' ? 'https://www.amazon.com.tr/s?k=' : 'https://www.amazon.com/s?k=';
    const marketplaceUrl = query => marketplaceHost + encodeURIComponent(query);
    const laptopMemorySpec = best.key === 'ramcap'
      ? inTr('32 GB RAM preferred', '32 GB RAM tercih et')
      : inTr('16 GB+ RAM', '16 GB+ RAM');
    const intro = budgetN > 0
      ? inTr('Laptop Options','Laptop Seçenekleri')
      : inTr('Laptop Options need a budget','Laptop seçenekleri için bütçe gerekli');
    if (budgetN <= 0) {
      return '<div class="example-block laptop-block">' +
        '<div class="discovery-head">' + intro + '</div>' +
        '<div class="path-copy">' +
          inTr('Enter a budget to compare rough laptop classes. Until a live product API is connected, UpgradePilot will show honest example tiers instead of pretending to know current listings.',
               'Laptop siniflarini karsilastirmak icin butce gir. Canli urun API baglanana kadar UpgradePilot guncel ilan biliyormus gibi yapmaz; durust ornek seviyeler gosterir.') +
        '</div>' +
      '</div>';
    }

    const tiers = [
      {
        min: 0, max: 850,
        k: inTr('Value laptop option','Fiyat odakli laptop seçeneği'),
        t: 'RTX 4050 / RTX 5050 class',
        specs: [laptopMemorySpec, '512 GB SSD', '1080p'],
        q: 'laptop RTX 5050 32GB SSD',
        c: inTr('Prioritize memory capacity, cooling, and upgradeability over the thinnest chassis.',
                'En ince kasa yerine bellek kapasitesi, soğutma ve yükseltilebilirliği önceliklendir.')
      },
      {
        min: 850, max: 1250,
        k: inTr('Best value laptop lane','En mantikli laptop araligi'),
        t: 'RTX 5060 class',
        specs: [laptopMemorySpec, '1 TB SSD', 'strong cooling'],
        q: 'laptop RTX 5060 32GB 1TB',
        c: inTr('A balanced current-generation target. Compare GPU wattage, cooling, screen quality, and memory configuration.',
                'Dengeli güncel nesil hedef. GPU watt, soğutma, ekran kalitesi ve bellek yapılandırmasını karşılaştır.')
      },
      {
        min: 1250, max: 1800,
        k: inTr('Performance laptop option','Performans laptop seçeneği'),
        t: 'RTX 5070 / RTX 5070 Ti class',
        specs: ['32 GB RAM', '1 TB SSD', 'high-watt GPU'],
        q: 'laptop RTX 5070 Ti 32GB 1TB',
        c: inTr('Choose this tier for stronger sustained performance. Cooling and GPU power limits matter more than the badge alone.',
                'Daha güçlü sürekli performans için bu sınıfa bak. Soğutma ve GPU güç limiti tek başına model adından daha önemlidir.')
      },
      {
        min: 1800, max: Infinity,
        k: inTr('High-end laptop option','Üst seviye laptop seçeneği'),
        t: 'RTX 5080 class',
        specs: ['32 GB RAM', '1 TB+ SSD', 'premium cooling'],
        q: 'laptop RTX 5080 32GB 1TB',
        c: inTr('Only worth considering when the budget supports premium cooling, display, and warranty quality.',
                'Yalnızca bütçe kaliteli soğutma, ekran ve garantiyi de karşılıyorsa değerlendir.')
      }
    ];
    const nearby = tiers.filter(tier => budgetUSD >= tier.min * .85 && budgetUSD <= tier.max * 1.18).slice(0, 3);
    const cards = nearby.length ? nearby : [tiers[0], tiers[1]];
    return '<div class="example-block laptop-block">' +
      '<div class="discovery-head">' + intro + '</div>' +
      '<div class="example-grid laptop-grid">' + cards.map(card =>
        '<div class="example-card laptop-card" data-focus-part="system" data-focus-label="Laptop examples">' +
          '<div class="path-kicker">' + card.k + '</div>' +
          '<div class="example-title">' + card.t + '</div>' +
          '<div class="example-price">' + formatRangeForCurrency(Math.max(350, card.min || 450), card.max === Infinity ? budgetUSD * 1.2 : card.max, 'retail') + '</div>' +
          '<div class="laptop-specs">' + card.specs.map(spec => '<span>' + spec + '</span>').join('') + '</div>' +
          '<div class="path-copy">' + card.c + '</div>' +
          '<a class="link-slot" href="' + marketplaceUrl(card.q) + '" target="_blank" rel="noopener noreferrer">' + actionLabelFor('laptop') + '</a>' +
        '</div>'
      ).join('') + '</div>' +
      '<div class="info-note">' +
        inTr('Laptop examples are rough buying tiers, not live listings. When a product API is connected, this area can become real model recommendations.',
             'Laptop ornekleri canli ilan degil, yaklasik satin alma seviyeleridir. Urun API baglaninca bu alan gercek model onerilerine donusebilir.') +
      '</div>' +
    '</div>';
  }
  function buildCompleteBuildCards() {
    if (isLaptop) return '';

    // ── Rebuild candidate detection ──────────────────────────────────
    // A user is a rebuild candidate only if their platform is genuinely
    // at end-of-life AND incremental upgrades no longer make financial sense.

    const oldIntelGen = (
      cpuKey.startsWith('i3_6') || cpuKey.startsWith('i5_6') || cpuKey.startsWith('i7_6') ||
      cpuKey.startsWith('i3_7') || cpuKey.startsWith('i5_7') || cpuKey.startsWith('i7_7') ||
      cpuKey.startsWith('i3_8') || cpuKey.startsWith('i5_8') || cpuKey.startsWith('i7_8') ||
      // 9th gen is borderline — only if GPU is also weak
      ((cpuKey.startsWith('i5_9') || cpuKey.startsWith('i7_9') || cpuKey.startsWith('i9_9')) && gpuSc <= 4)
    );

    // Ryzen 1000 / 2000 only — NOT 3000 (R5 3600 still valid)
    const oldAmdGen = (
      cpuKey.startsWith('r3_1') || cpuKey.startsWith('r5_1') || cpuKey.startsWith('r7_1') ||
      cpuKey.startsWith('r3_2') || cpuKey.startsWith('r5_2') || cpuKey.startsWith('r7_2')
    );

    // GPU generation check — GTX 970/980, RTX 2060 and older
    const oldGpu = (
      cpuKey.startsWith('gtx9') ||
      gpuKey === 'gtx970' || gpuKey === 'gtx980' || gpuKey === 'gtx980ti' ||
      gpuKey === 'rtx2060' || gpuKey === 'rtx2060s' ||
      gpuKey === 'rtx2070' || gpuKey === 'rtx2070s' ||
      gpuKey === 'gtx1060_3gb' || gpuKey === 'gtx1060_6gb' ||
      gpuKey === 'gtx1070' || gpuKey === 'gtx1070ti' ||
      gpuKey === 'gtx1050ti' || gpuKey === 'gtx1080' || gpuKey === 'gtx1080ti'
    );

    const isDdr3 = ramType === 'ddr3';
    const weakPsuAndOldPlatform = (psuW > 0 && psuW < 500) && (oldIntelGen || oldAmdGen);
    const bothVeryWeak = cpuSc <= 4 && gpuSc <= 4;

    // True rebuild candidate: old platform + at least one more weak signal
    const isRebuildCandidate = (oldIntelGen || oldAmdGen || isDdr3) &&
      (oldGpu || weakPsuAndOldPlatform || bothVeryWeak || isDdr3);

    // Never show rebuild if user has a modern capable system
    // A user with cpuSc >= 7 OR gpuSc >= 7 has a sensible upgrade path
    const hasStrongComponent = cpuSc >= 7 || gpuSc >= 7;
    if (hasStrongComponent) return buildPlatformExtensionPath();
    if (!isRebuildCandidate) return buildPlatformExtensionPath();

    // ── Budget gate — don't show rebuild without serious budget intent ─
    if (budgetN > 0 && budgetUSD < 500) return '';

    // ── REBUILD CANDIDATE: Show "Complete System Alternatives" ────────
    const storeLinks = currentLang === 'tr'
      ? [
          { name: 'İncehesap',   url: 'https://www.incehesap.com/arama/?q=' },
          { name: 'Gaming.Gen',  url: 'https://www.gaming.gen.tr/ara/?q=' },
          { name: 'Sinerji',     url: 'https://www.sinerjibilisim.com.tr/arama?q=' },
          { name: 'İtopya',      url: 'https://www.itopya.com/arama?kelime=' }
        ]
      : [
          { name: 'Amazon',      url: 'https://www.amazon.com/s?k=' },
          { name: 'Newegg',      url: 'https://www.newegg.com/p/pl?d=' }
        ];

    const storeLink = (query) => {
      const s = storeLinks[0];
      return s.url + encodeURIComponent(query);
    };

    const builds = [
      {
        tier: inTr('Budget Build', 'Ekonomik Kasa'),
        tierCls: 'build-tier-budget',
        cpu: 'Ryzen 5 5600 / i5-12400F',
        gpu: 'RX 6600 / RTX 3060',
        ram: '2×8 GB DDR4-3200',
        perfTier: inTr('1080p High', '1080p Yüksek'),
        note: inTr(
          'Enough for 1080p at high settings in most titles. Good value if your current build is under 4/10 on both CPU and GPU.',
          'Çoğu oyunda 1080p yüksek ayar için yeterli. Mevcut kasanız CPU ve GPU olarak 4/10 altındaysa iyi değer sunar.'
        ),
        query: 'Ryzen 5 5600 RX 6600 gaming pc'
      },
      {
        tier: inTr('Balanced Build', 'Dengeli Kasa'),
        tierCls: 'build-tier-balanced',
        cpu: 'Ryzen 5 9600X / Ryzen 7 9700X',
        gpu: 'RTX 5060 Ti / RX 9060 XT',
        ram: '2×16 GB DDR5-6000',
        perfTier: inTr('1440p High', '1440p Yüksek'),
        note: inTr(
          'Current-generation AM5 platform with DDR5 and a balanced current GPU tier.',
          'DDR5 ve dengeli güncel GPU seviyesi sunan güncel nesil AM5 platformu.'
        ),
        query: 'Ryzen 5 9600X RTX 5060 Ti gaming pc'
      },
      {
        tier: inTr('Performance Build', 'Performans Kasası'),
        tierCls: 'build-tier-perf',
        cpu: 'Ryzen 7 9800X3D / Ryzen 7 9700X',
        gpu: 'RTX 5070 Ti / RX 9070 XT',
        ram: '2×16 GB DDR5-6000',
        perfTier: inTr('1440p / 4K Ultra', '1440p / 4K Ultra'),
        note: inTr(
          'Only makes sense if budget allows and current system scores below 4 on both components. Otherwise upgrade GPU alone first.',
          'Yalnızca bütçe yeterliyse ve mevcut sistem her iki bileşende 4\'ün altındaysa mantıklı. Aksi hâlde önce sadece GPU yükseltin.'
        ),
        query: 'Ryzen 7 9800X3D RTX 5070 Ti gaming pc build'
      }
    ];

    const visibleBuilds = budgetN > 0 && budgetUSD < 900
      ? builds.slice(0, 1)
      : budgetN > 0 && budgetUSD < 1400
      ? builds.slice(0, 2)
      : builds;

    return (
      '<div class="example-block build-block">' +
        '<div class="discovery-head">' +
          inTr('Desktop PC Options', 'Masaüstü PC Seçenekleri') +
        '</div>' +
        '<div class="build-trust-note">' +
          inTr(
            'Shown because your current platform has limited upgrade headroom. Upgrade-first is still recommended — a single GPU or CPU swap may deliver better value than a full rebuild.',
            'Mevcut platformunuzun yükseltme alanı sınırlı olduğu için gösteriliyor. Önce yükseltme hâlâ önerilir — tek bir GPU veya CPU değişimi komple yeniden yapıma göre daha iyi değer sunabilir.'
          ) +
        '</div>' +
        '<div class="example-grid build-grid">' +
          visibleBuilds.map(b =>
            '<div class="example-card build-card">' +
              '<div class="path-kicker ' + b.tierCls + '">' + b.tier + '</div>' +
              '<div class="build-specs-list">' +
                '<div class="build-spec-row"><span>' + inTr('CPU', 'İşlemci') + '</span><strong>' + b.cpu + '</strong></div>' +
                '<div class="build-spec-row"><span>' + inTr('GPU', 'Ekran Kartı') + '</span><strong>' + b.gpu + '</strong></div>' +
                '<div class="build-spec-row"><span>' + inTr('RAM', 'RAM') + '</span><strong>' + b.ram + '</strong></div>' +
                '<div class="build-spec-row"><span>' + inTr('Target', 'Hedef') + '</span><strong>' + b.perfTier + '</strong></div>' +
              '</div>' +
              '<div class="path-copy">' + b.note + '</div>' +
              '<div class="build-store-links">' +
                storeLinks.slice(0, 2).map(s =>
                  '<a class="link-slot build-link" href="' + s.url + encodeURIComponent(b.query) + '" target="_blank" rel="noopener noreferrer">' +
                    inTr('View on', 'Bak:') + ' ' + s.name +
                  '</a>'
                ).join('') +
              '</div>' +
            '</div>'
          ).join('') +
        '</div>' +
        '<div class="info-note">' +
          inTr(
            'These are example system tiers, not a shopping cart. Verify socket compatibility, BIOS support, RAM type, PSU capacity, and case clearance before buying.',
            'Bunlar örnek sistem seviyeleridir, hazır sepet değildir. Satın almadan önce soket uyumluluğunu, BIOS desteğini, RAM türünü, PSU kapasitesini ve kasa uyumunu doğrulayın.'
          ) +
        '</div>' +
      '</div>'
    );
  }

  // ── Platform extension path — for users who do NOT need a full rebuild ─
  function buildPlatformExtensionPath() {
    // Don't show if there's nothing meaningful to suggest
    if (cpuSc < 5 && gpuSc < 5) return ''; // both weak — rebuild path handles this

    const isAm4 = cpuKey.includes('r5_5') || cpuKey.includes('r7_5') || cpuKey.includes('r5_3') ||
                  cpuKey.includes('r7_3') || cpuKey.includes('r7_5700') || cpuKey.includes('r9_5');
    const isAm5 = cpuKey.includes('r5_7') || cpuKey.includes('r7_7') || cpuKey.includes('r9_7') ||
                  cpuKey.includes('r5_9') || cpuKey.includes('r7_9') || cpuKey.includes('r9_9');
    const isIntel12Plus = cpuKey.includes('i5_12') || cpuKey.includes('i7_12') || cpuKey.includes('i5_13') ||
                          cpuKey.includes('i7_13') || cpuKey.includes('i9_13') || cpuKey.includes('i5_14') || cpuKey.includes('i7_14');

    let pathTitle = '', steps = [];

    if (isAm4) {
      pathTitle = inTr('AM4 Platform Extension', 'AM4 Platform Genişletme');
      steps = [
        { label: inTr('CPU upgrade within AM4', 'AM4 içi CPU yükseltme'), val: 'Ryzen 5 5700X3D / 5800X3D', note: inTr('Drop-in if BIOS supports it. Best gaming value on AM4.', 'BIOS destekliyorsa direkt takıl. AM4\'te en iyi oyun değeri.') },
        { label: inTr('RAM', 'RAM'), val: '2×16 GB DDR4-3600 CL16', note: inTr('If on 8 GB or single channel. Dual channel matters.', '8 GB veya single channel\'daysa. Dual channel önemli.') },
        { label: inTr('Keep GPU', 'GPU\'yu koru'), val: inTr('Reuse your current GPU', 'Mevcut GPU\'nuzu kullanmaya devam edin'), note: inTr('GPU upgrade is separate — follow primary recommendation above.', 'GPU yükseltme ayrı — yukarıdaki ana öneriyi takip edin.') },
        { label: inTr('Platform note', 'Platform notu'), val: inTr('AM4 upgrade runway ends here', 'AM4 yükseltme sonu'), note: inTr('After this CPU, next meaningful step is AM5.', 'Bu CPU\'dan sonra anlamlı adım AM5\'tir.') }
      ];
    } else if (isAm5) {
      pathTitle = inTr('AM5 Platform Extension', 'AM5 Platform Genişletme');
      steps = [
        { label: inTr('CPU upgrade', 'CPU yükseltme'), val: 'Ryzen 7 7800X3D / 9800X3D', note: inTr('Same socket, large gaming gain. Worth it if GPU is strong.', 'Aynı soket, büyük oyun kazanımı. GPU güçlüyse değer.') },
        { label: inTr('RAM', 'RAM'), val: '2×16 GB DDR5-6000 CL30', note: inTr('Sweet spot for AM5 gaming.', 'AM5 oyun için ideal nokta.') },
        { label: inTr('GPU', 'GPU'), val: inTr('Follow primary recommendation', 'Ana öneriyi takip et'), note: '' }
      ];
    } else if (isIntel12Plus) {
      pathTitle = inTr('Intel Platform Extension', 'Intel Platform Genişletme');
      steps = [
        { label: inTr('CPU upgrade', 'CPU yükseltme'), val: 'i7-13700KF / i9-13900K', note: inTr('LGA1700 is compatible if motherboard supports. Check VRM quality.', 'Anakart destekliyorsa LGA1700 uyumlu. VRM kalitesini kontrol et.') },
        { label: inTr('RAM', 'RAM'), val: '2×16 GB DDR4-3600 / DDR5-5600', note: inTr('Depends on your motherboard generation.', 'Anakart nesline göre değişir.') },
        { label: inTr('GPU', 'GPU'), val: inTr('Follow primary recommendation', 'Ana öneriyi takip et'), note: '' }
      ];
    } else {
      // Generic: no clear platform suggestion
      return '';
    }

    return (
      '<div class="example-block extension-block">' +
        '<div class="discovery-head">' + pathTitle + '</div>' +
        '<div class="extension-note">' +
          inTr(
            'Your platform still has upgrade headroom. A full rebuild is not necessary.',
            'Platformunuzun hâlâ yükseltme alanı var. Komple yeniden yapıma gerek yok.'
          ) +
        '</div>' +
        '<div class="extension-steps">' +
          steps.map(s =>
            '<div class="extension-step">' +
              '<div class="extension-step-label">' + s.label + '</div>' +
              '<div class="extension-step-val">' + s.val + '</div>' +
              (s.note ? '<div class="extension-step-note">' + s.note + '</div>' : '') +
            '</div>'
          ).join('') +
        '</div>' +
      '</div>'
    );
  }
  let budHTML = '';
  if (bandDesc) {
    budHTML += '<div class="price-block">' +
      '<div class="price-range">' + inTr('Rough estimate range: ','Yaklasik tahmini aralik: ') + (isTr ? PRICE_TR[priceKey] : bandDesc[2]) + '</div>' +
      '<div class="price-range">$' + bandDesc[0] + ' – $' + bandDesc[1] + ' USD</div>' +
      (currency === 'eur' ? '<div class="price-range">~€' + Math.round(bandDesc[0] / 1.08) + ' – €' + Math.round(bandDesc[1] / 1.08) + ' EUR</div>' : '') +
      (currency === 'try' ? '<div class="price-range">~₺' + tryMin.toLocaleString('tr-TR') + ' – ₺' + tryMax.toLocaleString('tr-TR') + ' TRY ' + tryFxHelp + '</div>' : '') +
      (currency === 'try' ? '<div class="price-market-grid">' +
        '<div class="price-market-row"><span>' + inTr('Value / used target','Value / ikinci el hedef') + '</span><strong>~TRY ' + tryValueMin.toLocaleString('tr-TR') + ' - ' + tryValueMax.toLocaleString('tr-TR') + '</strong></div>' +
        '<div class="price-market-row"><span>' + inTr('New retail check','Sifir magaza kontrol') + '</span><strong>~TRY ' + tryRetailMin.toLocaleString('tr-TR') + ' - ' + tryRetailMax.toLocaleString('tr-TR') + '</strong></div>' +
        (budgetN > 0 ? '<div class="price-market-row price-market-row-soft"><span>' + inTr('Your budget buying power','Butcenin alim gucu') + '</span><strong>~$' + budgetEquivalentUSD + ' value USD</strong></div>' : '') +
      '</div>' : '') +
      '<div class="price-note">' + inTr('Rough retail estimate. Used market, taxes, stock, and local pricing can change the result.','Yaklasik perakende tahmini. Ikinci el, vergi, stok ve yerel fiyatlar sonucu degistirebilir.') + '</div>' +
    '</div>';
  }
  budHTML += buildBudgetDiscoveryCards();
  // buildExamplePartCards() now renders in Section 02 (top) — see upgrade-picks above
  budHTML += buildCompleteBuildCards();
  budHTML +=
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">' +
      '<div class="metric"><div class="mlabel">' + inTr('Budget Match','Bütçe Eşleşmesi') + '</div><div class="mval ' + budgetFitCls + '">' + budgetFitLabel + '</div><div class="msub">' + budgetFitNote + '</div></div>' +
      '<div class="metric"><div class="mlabel">' + inTr('Waste Risk','Boşa Harcama Riski') + '</div><div class="mval ' + wasteClass + '">' + wasteLevel + '</div><div class="msub">' + wasteSub + '</div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-top:.65rem">' +
      '<div class="metric"><div class="mlabel">' + inTr('Upgrade Value Score','Yükseltme Değer Puanı') + '</div><div class="mval ' + scCls + '">' + sc + '/10</div><div class="msub">' + (sc>=7?inTr('Strong estimated value','Güçlü tahmini değer'):sc>=4?inTr('Moderate estimated value','Orta tahmini değer'):inTr('Low — optimize first','Düşük — önce optimize et')) + '</div><div class="sbar-wrap"><div class="sbar" style="width:' + (sc*10) + '%;background:' + barClr + '"></div></div></div>' +
      '<div class="metric"><div class="mlabel">' + inTr('Rough Performance Estimate','Yaklasik Performans Tahmini') + '</div><div class="mval ' + gain.cls + '">' + gain.label + '</div><div class="msub">' + gain.note + '</div></div>' +
      (throttleLoss.show ? '<div class="metric"><div class="mlabel">' + inTr('Thermal / Throttle Loss','Sicaklik / Throttle Kaybi') + '</div><div class="mval ' + throttleLoss.cls + '">' + throttleLoss.label + '</div><div class="msub">' + throttleLoss.note + '</div></div>' : '') +
    '</div>';
  if (currency === 'try') {
    budHTML += '<div class="info-note">' + inTr('Prices are rough market estimates, not live listings. Used-market value depends heavily on condition, warranty and seller trust.','Fiyatlar canlı piyasa verisi değildir; yaklaşık değer aralığıdır. İkinci el değeri kondisyon, garanti ve satıcı güvenine göre ciddi değişebilir.') + '</div>';
  }
  if (isLaptop) {
    budHTML += '<div class="info-note">' + inTr('Laptop mode: desktop PSU and internal CPU/GPU upgrade paths are hidden. Compare complete laptop classes only after checking temperatures, charger connection, performance mode, RAM, and SSD options.','Laptop modu: masaustu PSU ve dahili CPU/GPU yukseltme rotalari gizlenir. Komple laptop siniflarini ancak sicaklik, adaptor baglantisi, performans modu, RAM ve SSD seceneklerini kontrol ettikten sonra karsilastir.') + '</div>';
  }
  _h('budget-content', budHTML);

  // 07 DNU
  const dnuEl = el('dnu-row');
  if (dnuEl) {
    if (dnuSet.size) {
      dnuEl.innerHTML =
        '<div class="dnu-intro">' + inTr('For this setup, I would not buy these first:','Bu sistemde ilk olarak bunlara para harcama:') + '</div>' +
        [...dnuSet].map(k => '<span class="dnu-tag">' + (PART_LABEL[k]||k) + '</span>').join('');
    } else {
      dnuEl.innerHTML = '<div class="dnu-intro">' + inTr('I do not see a clearly unnecessary category from the current inputs.','Mevcut bilgilere göre tamamen gereksiz görünen net bir kategori yok.') + '</div>';
    }
  }

  // 08 Final Decision
  _c('final-box', 'final-box ' + finalCls);
  _h('fi', finalIco);
  _s('ft', finalSent);
  setLatestResultSummary([
    'UpgradePilot Result',
    'System health: ' + diagnostics.systemScore + '/100',
    'Main issue: ' + diagnostics.bottleneckLabel,
    'Upgrade priority: ' + diagnostics.priorityLabel,
    'Estimated gain: ' + gain.label,
    'Confidence: ' + diagnostics.confidenceLabel,
    'Decision: ' + finalSent,
    'Best next move: ' + meta.name + ' - ' + meta.sub,
    'Why: ' + diagnosticWhyText,
    'Action plan: ' + actionPlan.join(' | '),
    'Budget match: ' + budgetFitLabel + ' - ' + budgetFitNote,
    'Waste risk: ' + wasteLevel + ' - ' + wasteSub,
    dnuSet.size ? 'Do not buy first: ' + [...dnuSet].map(k => PART_LABEL[k] || k).join(', ') : 'Do not buy first: no clearly unnecessary category found',
    'CPU: ' + cpuName,
    'GPU: ' + gpuName,
    'RAM: ' + ramGB + 'GB ' + ramType.toUpperCase(),
    'Target: ' + resLabel + ' / ' + hz + 'Hz / ' + gameLabel,
    'Use UpgradePilot to validate before spending.'
  ].join('\n'));
  setCopyButtonState(false);

  // showResultPage handles accordion reset + free boost update
  showResultPage();
}
