// ── Helpers ──
function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }
function el(id){ return document.getElementById(id); }
function toggleCheck(id){
  const row=el('ci-'+id), box=row.querySelector('.cbox');
  const on=box.classList.toggle('on');
  box.textContent=on?'\u2713':'';
  row.classList.toggle('done',on);
}

// ── Dynamic RAM speed dropdown ──
// Rebuilds the Memory Speed options when Memory Type changes.
// No "I don't know" — user selects their actual speed or closest match.
function updateRamSpeeds() {
  const type = el('ram-type').value;
  const spd  = el('ram-speed');
  spd.innerHTML = '';

  // Speed options per memory type
  const OPTS = {
    ddr4: [
      ['ddr4_2400','DDR4 2400'],['ddr4_2666','DDR4 2666'],
      ['ddr4_3000','DDR4 3000'],['ddr4_3200','DDR4 3200'],
      ['ddr4_3600','DDR4 3600'],['ddr4_4000','DDR4 4000+'],
    ],
    ddr5: [
      ['ddr5_4800','DDR5 4800'],['ddr5_5200','DDR5 5200'],
      ['ddr5_5600','DDR5 5600'],['ddr5_6000','DDR5 6000'],
      ['ddr5_6400','DDR5 6400+'],['ddr5_7200','DDR5 7200+'],
    ],
  };

  // Sensible default when type changes
  const DEFAULT = { ddr4: 'ddr4_3200', ddr5: 'ddr5_4800' };
  const def = DEFAULT[type] || 'ddr4_3200';

  (OPTS[type] || OPTS.ddr4).forEach(([v,t]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = t;
    if (v === def) o.selected = true;
    spd.appendChild(o);
  });
}

function cpuMemoryMode(cpuKey) {
  if (cpuKey.startsWith('r5_7') || cpuKey.startsWith('r7_7') || cpuKey.startsWith('r9_7') ||
      cpuKey.startsWith('r5_9') || cpuKey.startsWith('r7_9') || cpuKey.startsWith('r9_9')) return 'ddr5';
  if (cpuKey.startsWith('r5_3') || cpuKey.startsWith('r5_5') || cpuKey.startsWith('r7_5') || cpuKey.startsWith('r9_5')) return 'ddr4';
  if (cpuKey.startsWith('i5_10') || cpuKey.startsWith('i7_10') || cpuKey.startsWith('i5_11') || cpuKey.startsWith('i7_11')) return 'ddr4';
  if (cpuKey.startsWith('i5_12') || cpuKey.startsWith('i7_12') || cpuKey.startsWith('i9_12') ||
      cpuKey.startsWith('i5_13') || cpuKey.startsWith('i7_13') || cpuKey.startsWith('i9_13') ||
      cpuKey.startsWith('i5_14') || cpuKey.startsWith('i7_14') || cpuKey.startsWith('i9_14')) return 'both';
  if (cpuKey.startsWith('ultra')) return 'ddr5';
  return 'both';
}

function updateMemoryCompatibility() {
  const cpuKey = el('cpu').value;
  const mode = cpuMemoryMode(cpuKey);
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
      ? inTr('This CPU generation can commonly be found with DDR4 or DDR5 motherboards. Pick the RAM type your motherboard actually uses.', 'Bu işlemci nesli DDR4 veya DDR5 anakartlarla kullanılabiliyor. Anakartında hangi RAM varsa onu seç.')
      : mode === 'ddr5'
        ? inTr('This CPU platform expects DDR5 memory.', 'Bu işlemci platformu DDR5 bellek kullanır.')
        : inTr('This CPU platform expects DDR4 memory.', 'Bu işlemci platformu DDR4 bellek kullanır.');
  }
  updateQuickChips();
}

function normalizePartSearch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function filterSelectOptions(selectId, query) {
  const select = el(selectId);
  const q = query.trim().toLowerCase();
  const nq = normalizePartSearch(q);
  select.querySelectorAll('option').forEach(option => {
    const label = option.textContent.toLowerCase();
    const normalizedLabel = normalizePartSearch(label + ' ' + option.value);
    option.hidden = q && !label.includes(q) && !normalizedLabel.includes(nq);
  });
  select.querySelectorAll('optgroup').forEach(group => {
    group.hidden = q && ![...group.querySelectorAll('option')].some(option => !option.hidden);
  });
}

function quickPick(selectId, value) {
  setSelectValue(selectId, value);
  const search = el(selectId + '-search');
  if (search) {
    search.value = '';
    filterSelectOptions(selectId, '');
  }
  if (selectId === 'cpu') updateMemoryCompatibility();
  updateQuickChips();
}

function updateQuickChips() {
  ['cpu','gpu'].forEach(id => {
    const val = el(id).value;
    document.querySelectorAll('#' + id + '-popular .quick-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('onclick').includes("'" + val + "'"));
    });
  });
}

function applyUserMode() {
  const mode = el('user-mode') ? el('user-mode').value : 'expert';
  document.querySelectorAll('.advanced-field').forEach(node => {
    node.classList.toggle('is-hidden', mode === 'guided');
  });
}

function updatePsuReadout() {
  const readout = el('psu-readout');
  if (readout) readout.textContent = el('psu-watts').value;
}

function setSelectValue(id, value) {
  const node = el(id);
  if (node) node.value = value;
}

function detectDisplay() {
  const width = window.screen && window.screen.width ? window.screen.width : window.innerWidth;
  const height = window.screen && window.screen.height ? window.screen.height : window.innerHeight;
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  if (longEdge >= 3500 || shortEdge >= 1900) setSelectValue('res', '4k');
  else if (longEdge >= 2300 || shortEdge >= 1300) setSelectValue('res', '1440');
  else setSelectValue('res', '1080');
}

function suggestResolution() {
  const gpuSc = GPU_SCORE[el('gpu').value] || 5;
  const hz = parseInt(el('hz').value);
  const goal = el('goal').value;
  const game = el('game').value;
  let suggested = '1440';
  if ((goal === 'latency' || game === 'compfps') && hz >= 144) suggested = '1080';
  else if (gpuSc >= 9 && goal !== 'fps') suggested = '4k';
  else if (gpuSc <= 4) suggested = '1080';
  setSelectValue('res', suggested);
}

function applyPopularGame() {
  const preset = el('popular-game').value;
  const map = {
    cs2:['compfps','latency'], valorant:['compfps','latency'],
    fortnite:['battle','fps'], warzone:['battle','fps'], pubg:['battle','fps'],
    gta:['aaa','smooth'], cyberpunk:['aaa','visuals'], rdr2:['aaa','visuals'], elden:['aaa','smooth'],
    lol:['compfps','fps'], minecraft:['modded','smooth'], msfs:['racing','smooth'],
  };
  if (!map[preset]) return;
  setSelectValue('game', map[preset][0]);
  setSelectValue('goal', map[preset][1]);
}

function setBudgetPreset(amount) {
  el('budget').value = amount;
}

// Initialise dropdown on page load
window.addEventListener('DOMContentLoaded', () => {
  updateMemoryCompatibility();
  updatePsuReadout();
  applyUserMode();
  updateQuickChips();
  setLanguage('en');
});

/* ==============================================================
   MAIN ANALYZE FUNCTION
   ============================================================== */
function analyze(skipLoading) {
  if (!skipLoading) {
    const loader = el('loading-card');
    const result = el('result');
    if (result) result.classList.remove('show');
    if (loader) loader.classList.add('show');
    setTimeout(() => analyze(true), 750);
    return;
  }
  const loader = el('loading-card');
  if (loader) loader.classList.remove('show');

  // ── Read inputs ──
  const cpuKey   = el('cpu').value;
  const gpuKey   = el('gpu').value;
  const ramGB    = parseInt(el('ram').value);         // 8|16|32|64
  const ramType  = el('ram-type').value;              // 'ddr4' | 'ddr5'
  const ramSpVal = el('ram-speed').value;             // e.g. 'ddr4_3200', 'unknown', 'slow'
  const channel  = el('channel').value;               // dual|single|unknown
  const psuW     = parseInt(el('psu-watts').value)||0;
  const psuEff   = el('psu-eff') ? el('psu-eff').value : 'unknown';
  const systemType = el('system-type').value;
  const cpuCooler  = el('cpu-cooler').value;
  const gameDrive  = el('game-drive').value;
  const osVersion  = el('os-version').value;
  // XMP/EXPO and slot placement not in form this version — kept as placeholders for future logic
  // const xmp   = 'unknown';  // future: re-enable if form field is added back
  // const slots = 'unknown';  // future: re-enable if form field is added back
  // PSU connector not in form — noted for future
  // const psuConn = 'unknown';
  const res      = el('res').value;
  const hz       = parseInt(el('hz').value);
  const game     = el('game').value;
  const goal     = el('goal').value;
  const budgetN  = parseFloat(el('budget').value)||0;
  const currency = el('currency').value;

  // ── Derived values ──
  const cpuSc     = CPU_SCORE[cpuKey];
  const gpuSc     = GPU_SCORE[gpuKey];
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

  // ── PSU readiness ──
  const psuMaxNow    = psuMaxGpu(psuW);
  const psuDanger    = !isLaptop && psuW > 0 && gpuSc > psuMaxNow;
  const nextGpuSc    = Math.min(10, gpuSc + 2);
  const psuBlockUpgr = !isLaptop && nextGpuSc > psuMaxNow;

  // ── RAM configuration flags ──
  // channel is always 'dual' or 'single' — no unknown option
  const isSingleCh = channel === 'single';

  // ── RAM config penalty ──
  // Reflects how much free-fix RAM issues are likely dragging performance
  let ramConfigPenalty = 0;
  if (isSingleCh) ramConfigPenalty += 4;  // 50% bandwidth loss — critical fix required

  function estimatedGainForUpgrade() {
    if (best.score <= 1 || singleChannelPreBuyBlocker || (isLaptop && (best.key === 'gpu' || best.key === 'cpu' || best.key === 'psu'))) {
      return {
        label: '+0-5%',
        cls: 'c-mid',
        note: inTr('No paid part is likely to deliver a clean gain before the blocker is fixed.', 'Blokaj cozulmeden ucretli bir parcanin temiz kazanc vermesi beklenmez.')
      };
    }
    if (best.key === 'gpu') {
      const target = res === '4k' ? 9 : res === '1440' ? 8 : hz >= 165 ? 7 : 6;
      const gap = Math.max(1, target - gpuSc);
      const resMult = res === '4k' ? 1.25 : res === '1440' ? 1.1 : .9;
      const low = clamp(Math.round((gap * 8 + (game === 'aaa' ? 8 : 4)) * resMult), 10, 55);
      const high = clamp(Math.round((gap * 16 + (goal === 'visuals' ? 14 : 10)) * resMult), low + 8, 85);
      return {
        label: '+' + low + '-' + high + '%',
        cls: high >= 35 ? 'c-hi' : 'c-mid',
        note: inTr('Estimated average-FPS uplift if the GPU is the confirmed limiter.', 'GPU gercek sinirlayiciysa tahmini ortalama FPS artisi.')
      };
    }
    if (best.key === 'cpu') {
      const target = (game === 'compfps' || goal === 'latency' || hz >= 165) ? 9 : 8;
      const gap = Math.max(1, target - cpuSc);
      const hzBonus = hz >= 165 ? 8 : hz >= 120 ? 4 : 0;
      const gpuHeadroom = cpuGpuGap >= 3 ? 8 : cpuGpuGap >= 2 ? 4 : 0;
      const low = clamp(Math.round(gap * 5 + hzBonus / 2 + gpuHeadroom / 2), 6, 35);
      const high = clamp(Math.round(gap * 10 + hzBonus + gpuHeadroom), low + 6, 60);
      return {
        label: '+' + low + '-' + high + '%',
        cls: high >= 25 ? 'c-hi' : 'c-mid',
        note: inTr('Estimated gain in CPU-limited games, high-Hz play, or 1% lows.', 'CPU sinirli oyunlarda, yuksek Hz hedefinde veya 1% low tarafinda tahmini kazanc.')
      };
    }
    if (best.key === 'ramcap') {
      return {
        label: ramGB <= 8 ? '+15-35%' : '+5-18%',
        cls: ramGB <= 8 ? 'c-hi' : 'c-mid',
        note: inTr('Mostly improves stutter, hitching, loading, and 1% lows rather than pure average FPS.', 'Saf ortalama FPS yerine daha cok takilma, yukleme ve 1% low tarafini iyilestirir.')
      };
    }
    if (best.key === 'ramspd') {
      return {
        label: '+3-12%',
        cls: 'c-mid',
        note: inTr('Most visible in CPU-sensitive games after confirming XMP/EXPO is already enabled.', 'En cok CPU hassas oyunlarda ve XMP/EXPO zaten aciksa gorunur.')
      };
    }
    if (best.key === 'psu') {
      return {
        label: '+0-3%',
        cls: 'c-mid',
        note: inTr('A PSU upgrade is mainly for stability and safety, not direct FPS.', 'PSU yukseltmesi dogrudan FPS icin degil, stabilite ve guvenlik icindir.')
      };
    }
    return {
      label: '+0-5%',
      cls: 'c-mid',
      note: inTr('Optimize first, then rerun the analysis for a cleaner estimate.', 'Once optimize et, sonra daha temiz tahmin icin analizi tekrar calistir.')
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
    ramCapP = 8;
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

  if (currency !== 'try') {
    if (budgetUSD < 150) {
      gpuP = Math.max(0, gpuP - 5);
      cpuP = Math.max(0, cpuP - 4);
    } else if (budgetUSD < 300) {
      gpuP = Math.max(0, gpuP - 2);
      cpuP = Math.max(0, cpuP - 1);
    }
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
  const resLabel  = {'1080':'1080p','1440':'1440p','4k':'4K'}[res];
  const gameLabel = (isTr ? {
    compfps:'rekabetçi FPS', mmorpg:'MMORPG', aaa:'AAA / açık dünya',
    battle:'battle royale', sim:'simülasyon / strateji', racing:'yarış / uçuş simülasyonu',
    modded:'modlu oyunlar', stream:'yayın / kayıt', mixed:'genel oyun'
  } : {
    compfps:'competitive FPS', mmorpg:'MMORPG', aaa:'AAA / open-world',
    battle:'battle royale', sim:'simulation / strategy', racing:'racing / flight sim',
    modded:'modded games', stream:'streaming', mixed:'general gaming'
  })[game];
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
  function upgradeImpactEstimate(partKey) {
    if (partKey === 'gpu') {
      let target = res === '4k' ? 9 : res === '1440' ? 8 : hz >= 165 ? 7 : 6;
      target = Math.max(target, Math.min(10, gpuSc + 2));
      const gap = Math.max(0, target - gpuSc);
      if (gap === 0) return null;
      const multiplier = is4k ? 14 : is1440 ? 12 : 9;
      const low = Math.max(8, Math.round(gap * multiplier * 0.75));
      const high = Math.min(80, Math.round(gap * multiplier * 1.45));
      return {range: '+' + low + '% to +' + high + '%', note: inTr('Estimated GPU-limited FPS uplift at this display target.', 'Bu ekran hedefinde GPU limitli FPS icin tahmini artis.')};
    }
    if (partKey === 'cpu') {
      const target = (game === 'compfps' || goal === 'latency' || goal === 'fps' || hz >= 165) ? 9 : 8;
      const gap = Math.max(0, target - cpuSc);
      if (gap === 0) return null;
      const multiplier = (game === 'compfps' || hz >= 165) ? 10 : 8;
      const low = Math.max(6, Math.round(gap * multiplier * 0.65));
      const high = Math.min(60, Math.round(gap * multiplier * 1.35));
      return {range: '+' + low + '% to +' + high + '%', note: inTr('Estimated CPU-bound FPS ceiling / 1% low uplift.', 'CPU sinirinda FPS tavani ve 1% low icin tahmini artis.')};
    }
    return null;
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
  // Always show core Windows fixes.
  // Expand startup/background advice when CPU, RAM, or balance is the issue.
  checks.push({g:'Windows', t:inTr('Check Windows Power Plan (Settings → Power). Avoid Power Saver mode — it actively throttles CPU and GPU clocks.','Windows Güç Planını kontrol et (Ayarlar → Güç). Güç Tasarrufu modundan kaçın — CPU ve GPU hızlarını aktif şekilde kısar.')});
  checks.push({g:'Windows', t:inTr('Enable Game Mode in Windows Settings → Gaming → Game Mode. This may reduce background interruptions during gameplay.','Windows Ayarları → Oyun → Oyun Modu kısmından Oyun Modu’nu aç. Bu, oyun sırasında arka plan kesintilerini azaltabilir.')});
  checks.push({g:'Windows', t:inTr('Confirm your monitor refresh rate is set correctly in Windows Display Settings — it can default to 60 Hz even on high-refresh monitors.','Windows ekran ayarlarında monitör yenileme hızının doğru seçildiğini doğrula — yüksek Hz monitörlerde bile bazen 60 Hz’e düşebilir.')});

  if (showCPU || diagKey === 'opt' || diagKey === 'bal') {
    checks.push({g:'Windows', t:inTr('Disable unnecessary startup apps in Task Manager → Startup Apps. Fewer background processes means more CPU and RAM available for your game.','Görev Yöneticisi → Başlangıç Uygulamaları kısmından gereksiz başlangıç programlarını kapat. Daha az arka plan işlemi, oyuna daha fazla CPU ve RAM kalması demek.')});
    checks.push({g:'Windows', t:inTr('Close heavy background apps before launching — browsers, cloud sync, Discord video, recording tools, and game launchers all consume CPU and RAM headroom.','Oyuna girmeden önce ağır arka plan uygulamalarını kapat — tarayıcılar, bulut senkronizasyonu, Discord video, kayıt araçları ve launcher’lar CPU/RAM payını tüketir.')});
  }

  if (diagKey === 'opt' || diagKey === 'bal') {
    // Temp files: maintenance framing only — no FPS overclaim
    checks.push({g:'Windows', t:inTr('Clearing temporary files is useful for storage maintenance, but is not usually a direct FPS fix — unless your system drive is nearly full.','Geçici dosyaları temizlemek depolama bakımı için iyidir; ama sistem diskin neredeyse dolu değilse genelde doğrudan FPS çözümü değildir.')});
  }


  // ── System / Cooling / Display ──────────────────────────────
  if (osVersion === 'win10' && isModernIntelHybrid) {
    checks.push({g:'Windows Version', t:inTr('You selected Windows 10 with a modern Intel hybrid CPU. Consider testing Windows 11 later; its scheduler is generally safer for P-core / E-core behaviour. Do not reinstall just for this before measuring temperatures and usage first.','Modern Intel hibrit işlemciyle Windows 10 seçtin. İleride Windows 11 denemek mantıklı olabilir; P-core / E-core zamanlaması tarafında genelde daha güvenli seçimdir. Ama sıcaklık ve kullanım değerlerini ölçmeden sırf bunun için format atma.')});
  }
  if (hz === 60 && (game === 'compfps' || goal === 'latency' || goal === 'fps')) {
    checks.push({g:'Display / Monitor', t:inTr('Your monitor is set to 60 Hz. For competitive FPS or low-latency goals, a 144 Hz+ monitor can be more noticeable than a small CPU/GPU upgrade. First confirm Windows is not accidentally limiting a high-refresh monitor to 60 Hz.','Monitör 60 Hz seçili. Rekabetçi FPS veya düşük gecikme hedefinde 144 Hz+ monitör, küçük bir CPU/GPU yükseltmesinden daha hissedilir olabilir. Önce Windows’un yüksek Hz monitörü yanlışlıkla 60 Hz’e sabitlemediğini doğrula.')});
  }
  if (isLaptop) {
    checks.push({g:'Laptop Cooling', t:inTr('Laptop selected: CPU/GPU upgrades are usually limited. Before spending money, clean dust from fans/vents, use the laptop on a hard surface, and check temperatures under load. Thermal throttling can look like a hardware bottleneck.','Laptop seçildi: CPU/GPU yükseltmesi çoğu laptopta sınırlıdır. Para harcamadan önce fan/ızgara toz temizliği yap, laptopu sert zeminde kullan ve yük altında sıcaklıkları kontrol et. Thermal throttling donanım darboğazı gibi görünebilir.')});
  } else if (strongCpu && (weakCooler || unknownCooler)) {
    checks.push({g:'Cooling / Thermals', t:inTr('You selected a strong CPU with weak or unknown cooling. Check CPU temperatures first. If the CPU cannot hold boost clocks, a better tower air cooler or 240mm+ liquid cooler may be more sensible than changing the CPU.','Güçlü bir işlemciyle zayıf/bilinmeyen soğutma seçtin. Önce CPU sıcaklıklarını kontrol et. İşlemci boost hızlarını koruyamıyorsa CPU değiştirmek yerine iyi bir kule tipi hava soğutucu veya 240mm+ sıvı soğutma daha mantıklı olabilir.')});
  }
  if (hddGameDrive) {
    checks.push({g:'Storage Upgrade', t:inTr('Your game drive is HDD. For modern open-world, MMORPG, battle royale, and modded games, moving the game to a SATA SSD or NVMe SSD is often a better first upgrade than chasing average FPS. It mainly improves loading, asset streaming, stutter, and 1% lows.','Oyunun HDD’de kurulu. Modern açık dünya, MMORPG, battle royale ve modlu oyunlarda oyunu SATA SSD veya NVMe SSD’ye taşımak çoğu zaman ortalama FPS kovalamaktan daha mantıklı ilk yükseltmedir. Asıl etkisi yükleme, asset streaming, takılma ve 1% low tarafında olur.')});
  }

  // ── GPU ──────────────────────────────────────────────────────
  // Show when GPU is the diagnosed or recommended bottleneck.
  if (showGPU) {
    checks.push({g:'GPU', t:inTr('Update GPU drivers using NVIDIA App / GeForce Experience or AMD Adrenalin. Outdated drivers can cause performance regressions and stability issues.','NVIDIA App / GeForce Experience veya AMD Adrenalin ile ekran kartı sürücülerini güncelle. Eski sürücüler performans düşüşü ve stabilite sorunları yaratabilir.')});
    checks.push({g:'GPU', t:inTr('Check GPU temperature under load using MSI Afterburner or HWiNFO64. Sustained temperatures above 85°C may indicate thermal throttling or an airflow issue.','MSI Afterburner veya HWiNFO64 ile yük altında GPU sıcaklığını kontrol et. Uzun süre 85°C üstü sıcaklıklar thermal throttling veya kasa hava akışı sorununa işaret edebilir.')});
    checks.push({g:'GPU', t:inTr('Disable overlays you do not use — Discord, Steam, Xbox Game Bar, and NVIDIA/AMD overlay each add frametime overhead. Keep only what you actively need.','Kullanmadığın overlay’leri kapat — Discord, Steam, Xbox Game Bar ve NVIDIA/AMD overlay frametime yükü ekleyebilir. Sadece gerçekten kullandıklarını açık bırak.')});
    checks.push({g:'GPU', t:inTr('Before deciding to upgrade, lower GPU-heavy settings first: shadows, reflections, ambient occlusion, anti-aliasing, and volumetrics often recover significant FPS.','Yükseltmeye karar vermeden önce GPU’ya yüklenen ayarları düşür: gölgeler, yansımalar, ambient occlusion, kenar yumuşatma ve volumetric ayarlar genelde anlamlı FPS geri kazandırabilir.')});
    checks.push({g:'GPU', t:inTr('Try DLSS (NVIDIA) / FSR (AMD) / XeSS (Intel) if the game supports it — this can meaningfully improve frame rate with minimal visible quality loss.','Oyun destekliyorsa DLSS (NVIDIA) / FSR (AMD) / XeSS (Intel) dene — çoğu durumda görsel kaybı düşükken FPS’i anlamlı artırabilir.')});
    checks.push({g:'GPU', t:inTr('Monitor GPU usage during gameplay with MSI Afterburner. If it stays near 95–99%, the GPU is your confirmed bottleneck. If it is lower, the limit may be elsewhere.','MSI Afterburner ile oyun sırasında GPU kullanımını izle. Kullanım sürekli %95–99 civarındaysa darboğaz büyük ihtimalle GPU’dur. Daha düşükse limit başka yerde olabilir.')});
  }

  // ── CPU ──────────────────────────────────────────────────────
  // Show when CPU is the bottleneck or game type is CPU-sensitive.
  if (showCPU) {
    checks.push({g:'CPU', t:inTr('Update chipset drivers from AMD.com or Intel.com — not from Windows Update. These affect memory controller, PCIe, and CPU scheduling behaviour.','Chipset sürücülerini Windows Update yerine AMD.com veya Intel.com üzerinden güncelle. Bunlar bellek kontrolcüsü, PCIe ve CPU zamanlamasını etkiler.')});
    checks.push({g:'CPU', t:inTr('Check CPU temperature and throttling with HWiNFO64. Look for sustained core temperatures above 90°C (Intel) or 95°C (AMD Ryzen) during gaming load.','HWiNFO64 ile CPU sıcaklığı ve throttling durumunu kontrol et. Oyun yükünde Intel için 90°C, AMD Ryzen için 95°C üstü sürekli sıcaklıklara dikkat et.')});
    checks.push({g:'CPU', t:inTr('CPU boost behaviour (Precision Boost Overdrive on AMD, Intel Turbo) can be affected by BIOS settings — this will be covered in a future BIOS Optimization section.','CPU boost davranışı (AMD Precision Boost Overdrive, Intel Turbo) BIOS ayarlarından etkilenebilir — bu konu ileride BIOS Optimizasyon bölümünde ele alınacak.')});
  }

  // ── Memory ───────────────────────────────────────────────────
  // Show when RAM capacity, speed, or channel mode is a factor.
  if (showMemory) {
    if (isSingleCh) {
      checks.push({g:'Memory', t:inTr('Your RAM is in Single Channel mode. Moving both sticks to the correct dual-channel slots — typically the 2nd and 4th slots from the CPU socket (A2+B2) — may restore up to 50% of memory bandwidth. This costs nothing.','RAM Tek Kanal modunda. İki RAM’i doğru çift kanal slotlarına — genelde CPU soketinden itibaren 2. ve 4. slot (A2+B2) — takmak bellek bant genişliğini %50’ye kadar geri kazandırabilir. Bu ücretsiz.')});
    }
    checks.push({g:'Memory', t:inTr('Verify your actual RAM speed and channel mode using CPU-Z (free). Open the Memory tab and confirm the speed matches what you selected above, and that dual-channel is active.','CPU-Z ile gerçek RAM hızını ve kanal modunu kontrol et. Memory sekmesinde hızın yukarıda seçtiğin değere yakın olduğunu ve çift kanalın aktif olduğunu doğrula.')});
    if (ramSpd === 0) {
      // Slow speed: mention XMP/EXPO as a free fix but don't force it
      checks.push({g:'Memory', t:inTr('Your selected RAM speed is slow. Before buying new sticks, check whether XMP (Intel) or EXPO (AMD) is enabled in your BIOS — enabling it is free and may bring your RAM to its rated speed. Full XMP/EXPO guidance will be in a future BIOS Optimization section.','Seçtiğin RAM hızı düşük. Yeni RAM almadan önce BIOS’ta XMP (Intel) veya EXPO (AMD) açık mı kontrol et — açmak ücretsizdir ve RAM’i kendi hızına getirebilir. Detaylı XMP/EXPO rehberi ileride BIOS Optimizasyon bölümünde olacak.')});
    } else {
      // Normal/good speed: soft XMP reminder without pressure
      checks.push({g:'Memory', t:inTr('XMP / EXPO profile verification will be covered in a future BIOS Optimization section. For now, confirm your RAM speed looks correct in CPU-Z before buying any new sticks.','XMP / EXPO profil doğrulaması ileride BIOS Optimizasyon bölümünde olacak. Şimdilik yeni RAM almadan önce CPU-Z’de RAM hızının doğru göründüğünü kontrol et.')});
    }
  }

  // ── Storage / Stutter ────────────────────────────────────────
  // Show when stutter, open-world streaming, or large/modded games are relevant.
  if (showStutter) {
    checks.push({g:'Storage / Stutter', t:inTr('Install your game on an SSD or NVMe drive if possible. HDD installations cause longer load times, open-world streaming hitches, and elevated 1% lows — especially in large, open-world, or heavily modded games.','Mümkünse oyunu SSD veya NVMe diske kur. HDD kurulumları özellikle büyük, açık dünya veya modlu oyunlarda uzun yükleme, asset streaming takılması ve kötü 1% low değerleri yaratabilir.')});
    checks.push({g:'Storage / Stutter', t:inTr('Keep your game drive below 85–90% capacity. Near-full drives may show reduced read speeds, which can affect asset streaming in open-world titles.','Oyun diskinin doluluğunu %85–90 altında tut. Neredeyse dolu disklerde okuma hızı düşebilir; bu açık dünya oyunlarında asset streaming’i etkileyebilir.')});
    checks.push({g:'Storage / Stutter', t:inTr('Use RTSS (RivaTuner) or CapFrameX to measure frametime — not just average FPS. Stutter usually appears as frametime spikes and poor 1% lows, even when average FPS looks acceptable.','Sadece ortalama FPS’e bakma; RTSS (RivaTuner) veya CapFrameX ile frametime ölç. Stutter genelde ortalama FPS iyi görünse bile frametime spike ve zayıf 1% low olarak ortaya çıkar.')});
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


  function gpuTargetTierText() {
    let target = res === '4k' ? 9 : res === '1440' ? 8 : hz >= 165 ? 7 : 6;
    target = Math.max(target, Math.min(10, gpuSc + 1));
    const tiers = {
      6: 'RTX 3060 Ti / RX 6700 XT class',
      7: 'RTX 3070 / RX 7700 XT class',
      8: 'RTX 4070 / RX 7800 XT class',
      9: 'RTX 4070 Super / RTX 5070 / RX 7900 GRE class',
      10:'RTX 4080 / RX 7900 XTX+ class'
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
  } else if (currency === 'try') {
    budgetFitLabel = inTr('Live Price Needed','Güncel Fiyat Gerekli'); budgetFitCls = 'c-mid';
    budgetFitNote  = inTr('TRY prices move too much for a static estimate. Use this as a part priority result, then compare today’s local prices.','TL fiyatları çok oynak olduğu için burada net fiyat uydurmuyorum. Bu sonucu parça önceliği olarak kullan, sonra bugünkü yerel fiyatla karşılaştır.');
  } else if (budgetN === 0) {
    budgetFitLabel = inTr('Enter Budget','Bütçe Gir'); budgetFitCls = 'c-mid';
    budgetFitNote  = inTr('Enter your upgrade budget above for a budget fit result.','Bütçe uyumu görmek için yukarıya yükseltme bütçeni gir.');
  } else {
    const band = PRICE_USD[priceKey];
    if (budgetUSD >= band[1] * 1.2) {
      budgetFitLabel = inTr('Fits Comfortably','Rahat Yetiyor'); budgetFitCls = 'c-byes';
      budgetFitNote  = inTr('Your budget comfortably covers the estimated cost range.','Bütçen tahmini maliyet aralığını rahat karşılıyor.');
    } else if (budgetUSD >= band[0]) {
      budgetFitLabel = inTr('Tight But Possible','Sınırda Ama Olabilir'); budgetFitCls = 'c-btight';
      budgetFitNote  = inTr('Budget is in range but tight. Used or open-box market may help.','Bütçe aralığa giriyor ama sınırda. İkinci el veya outlet/open-box seçenekleri yardımcı olabilir.');
    } else {
      budgetFitLabel = inTr('Likely Not Enough','Muhtemelen Yetmez'); budgetFitCls = 'c-bno';
      budgetFitNote  = inTr('Below the estimated starting price. Consider saving more or used market.','Tahmini başlangıç fiyatının altında. Biraz daha bütçe ayırmayı veya ikinci eli düşün.');
    }
  }

  const sc     = best.score;
  const scCls  = sc >= 7 ? 'c-hi'   : sc >= 4 ? 'c-mid'   : 'c-lo';
  const barClr = sc >= 7 ? '#00ff88': sc >= 4 ? '#ffaa00' : '#ff4444';
  const gain = estimatedGainForUpgrade();

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
    gpu:    inTr('Upgrade your GPU first. Validate the bottleneck with benchmarks before purchasing.','Önce GPU yükselt. Satın almadan önce darboğazı benchmark ile doğrula.'),
    cpu:    inTr('Upgrade your CPU next. Confirm with HWiNFO64 before buying.','Sonraki yükseltme CPU olmalı. Satın almadan önce HWiNFO64 ile doğrula.'),
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
  } else if (isLaptop && best.score <= 2) {
    finalSent = inTr('Optimize the laptop first: clean cooling, check throttling, verify power mode, then consider RAM or SSD only if the tests point there.','Önce laptopu optimize et: soğutmayı temizle, throttling kontrol et, güç modunu doğrula; testler işaret ederse sadece RAM veya SSD düşün.');
    finalCls  = 'fb-hold'; finalIco = '&#9135;';
  } else if (best.score <= 2) {
    finalSent = inTr('Optimize first. Work through the free fixes in Section 02 and validate with benchmarks in Section 03 before spending money.','Önce optimize et. Para harcamadan önce 02. bölümdeki ücretsiz kontrolleri uygula ve 03. bölümde benchmark ile doğrula.');
    finalCls  = 'fb-hold'; finalIco = '&#9135;';
  } else {
    finalSent = FINAL_SENT[best.key] || inTr('Optimize first, then reconsider.','Önce optimize et, sonra tekrar değerlendir.');
    finalCls  = FINAL_CLS[best.key] || 'fb-hold';
    finalIco  = FINAL_ICO[best.key] || '&#126;';
  }

  /* ============================================================
     RENDER TO DOM
     ============================================================ */
  el('vbadge').textContent = verdictLabel;
  el('vbadge').className   = 'vbadge ' + verdictClass;

  // 01 Diagnosis
  el('diag-pill').textContent = diagLabel;
  el('diag-pill').className   = 'diag-pill ' + diagClass;
  el('diag-text').textContent = diagText;

  // 02 Free Fixes
  let lastGrp='', clHTML='';
  checks.forEach((c,i) => {
    if (c.g !== lastGrp) {
      clHTML += '<div class="cl-grp">' + groupLabel(c.g) + '</div>';
      lastGrp = c.g;
    }
    clHTML += '<div class="ci" id="ci-' + i + '" onclick="toggleCheck(' + i + ')"><div class="cbox"></div><span class="ctxt">' + c.t + '</span></div>';
  });
  el('checklist').innerHTML = clHTML;

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
  el('bench-list').innerHTML = bHTML;

  // 04 Best upgrade
  const meta = (best.score <= 1) ? PART_META.none : PART_META[best.key];
  el('uicon').innerHTML    = meta.icon;
  el('uicon').className    = 'uicon ' + meta.icls;
  el('uname').textContent  = meta.name;
  el('usub').textContent   = meta.sub;
  el('why-box').textContent = whyText;

  // 05 PSU Recommendation (desktop only — efficiency field removed for now)
  if (isLaptop) {
    el('psu-rec-content').innerHTML =
      '<div class="psu-verdict pv-warn"><span class="pvi">~</span><span>' +
      inTr('Laptop selected: desktop PSU and next-GPU-tier recommendations are not evaluated. Check power mode, charger connection, and thermal throttling instead.','Laptop seçildi: masaüstü PSU ve sonraki GPU seviyesi önerisi değerlendirilmez. Bunun yerine güç modu, adaptör bağlantısı ve thermal throttling kontrol edilmeli.') +
      '</span></div>';
  } else {
    el('psu-rec-content').innerHTML =
      '<div class="psu-rec-grid">' +
        '<div class="psu-rec-card"><div class="psu-rc-lbl">' + inTr('Your Current PSU','Mevcut PSU') + '</div><div class="psu-rc-val">' + (psuW ? psuW + 'W' : inTr('Unknown','Bilinmiyor')) + '</div></div>' +
        '<div class="psu-rec-card"><div class="psu-rc-lbl">' + inTr('Recommended for Next GPU Tier','Sonraki GPU Seviyesi İçin Öneri') + '</div><div class="psu-rc-val">' + psuRecWatts + ' &middot; ' + psuRecEff + '</div></div>' +
      '</div>' +
      '<div class="psu-verdict ' + psuVerdictCls + '"><span class="pvi">' + (psuVerdictCls==='pv-ok'?'&#10003;':psuVerdictCls==='pv-warn'?'~':'!') + '</span><span>' + psuVerdictText + '</span></div>';
  }

  // 06 Budget & Price
  const bandDesc = priceKey ? PRICE_USD[priceKey] : null;
  let budHTML = '';
  if (bandDesc) {
    budHTML += '<div class="price-block">' +
      '<div class="price-range">' + inTr('Estimated typical range: ','Tahmini tipik aralık: ') + (isTr ? PRICE_TR[priceKey] : bandDesc[2]) + '</div>' +
      (currency === 'usd' ? '<div class="price-range">$' + bandDesc[0] + ' – $' + bandDesc[1] + ' USD</div>' : '') +
      (currency === 'eur' ? '<div class="price-range">~€' + Math.round(bandDesc[0] / 1.08) + ' – €' + Math.round(bandDesc[1] / 1.08) + ' EUR</div>' : '') +
      '<div class="price-note">' + inTr('Estimated typical retail price range. Used market can change the result. Local pricing may vary.','Tahmini tipik perakende fiyat aralığıdır. İkinci el piyasası sonucu değiştirebilir. Yerel fiyatlar değişebilir.') + '</div>' +
    '</div>';
  }
  budHTML +=
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">' +
      '<div class="metric"><div class="mlabel">' + inTr('Budget Match','Bütçe Eşleşmesi') + '</div><div class="mval ' + budgetFitCls + '">' + budgetFitLabel + '</div><div class="msub">' + budgetFitNote + '</div></div>' +
      '<div class="metric"><div class="mlabel">' + inTr('Waste Risk','Boşa Harcama Riski') + '</div><div class="mval ' + wasteClass + '">' + wasteLevel + '</div><div class="msub">' + wasteSub + '</div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-top:.65rem">' +
      '<div class="metric"><div class="mlabel">' + inTr('Upgrade Value Score','Yükseltme Değer Puanı') + '</div><div class="mval ' + scCls + '">' + sc + '/10</div><div class="msub">' + (sc>=7?inTr('Strong estimated value','Güçlü tahmini değer'):sc>=4?inTr('Moderate estimated value','Orta tahmini değer'):inTr('Low — optimize first','Düşük — önce optimize et')) + '</div><div class="sbar-wrap"><div class="sbar" style="width:' + (sc*10) + '%;background:' + barClr + '"></div></div></div>' +
      '<div class="metric"><div class="mlabel">' + inTr('Estimated Performance Gain','Tahmini Performans Artisi') + '</div><div class="mval ' + gain.cls + '">' + gain.label + '</div><div class="msub">' + gain.note + '</div></div>' +
    '</div>';
  if (currency === 'try') {
    budHTML += '<div class="info-note">' + inTr('Turkish lira pricing is highly volatile. UpgradePilot cannot estimate TRY costs reliably. Check current prices on local retailers before budgeting.','Türk lirası fiyatları çok değişken. UpgradePilot TRY maliyetlerini güvenilir şekilde tahmin edemez. Bütçe belirlemeden önce yerel satıcılarda güncel fiyatları kontrol et.') + '</div>';
  }
  el('budget-content').innerHTML = budHTML;

  // 07 DNU
  const dnuEl = el('dnu-row');
  if (dnuSet.size) {
    dnuEl.innerHTML =
      '<div class="dnu-intro">' + inTr('For this setup, I would not spend money on these parts first:','Bu sistemde ilk olarak şu parçalara para harcamanı önermiyorum:') + '</div>' +
      [...dnuSet].map(k => '<span class="dnu-tag">' + (PART_LABEL[k]||k) + '</span>').join('');
  } else {
    dnuEl.innerHTML = '<div class="dnu-intro">' + inTr('I do not see a clearly unnecessary category from the current inputs.','Mevcut bilgilere göre tamamen gereksiz görünen net bir kategori yok.') + '</div>';
  }

  // 08 Final Decision
  el('final-box').className = 'final-box ' + finalCls;
  el('fi').innerHTML        = finalIco;
  el('ft').textContent      = finalSent;

  // Show result
  const r = el('result');
  r.className = 'show';
  r.style.animation = 'none';
  void r.offsetWidth;
  r.style.animation = 'fadeUp .45s ease both';
  setTimeout(() => r.scrollIntoView({behavior:'smooth',block:'start'}), 60);
}
