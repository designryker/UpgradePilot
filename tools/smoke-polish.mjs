import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ANALYSIS_SEQUENCE_MS,
  buildPartSearchText,
  getAnalysisMessages,
  getBiosRecommendation,
  getCurrentGpuRecommendations,
  normalizePartSearch,
} from '../src/recommendation-helpers.js';
import { classifyDisplayResolution, estimatePhysicalDisplay } from '../src/budget-display.js';
import { cpuMemoryMode, shouldShowMemoryTypeChoice } from '../src/memory-compat.js';

assert.deepEqual(
  estimatePhysicalDisplay({ width: 2048, height: 1152, devicePixelRatio: 1.25 }),
  { width: 2560, height: 1440 },
  'display detection should account for operating-system scaling'
);
assert.equal(classifyDisplayResolution(2560, 1440), '1440');
assert.equal(classifyDisplayResolution(3840, 2160), '4k');
assert.equal(classifyDisplayResolution(1920, 1080), '1080');
assert.equal(cpuMemoryMode('r5_5600'), 'ddr4');
assert.equal(cpuMemoryMode('r5_7600'), 'ddr5');
assert.equal(cpuMemoryMode('i5_13600kf'), 'both');
assert.equal(shouldShowMemoryTypeChoice(''), false);
assert.equal(shouldShowMemoryTypeChoice('r5_7600'), false);
assert.equal(shouldShowMemoryTypeChoice('i5_13600kf'), true);

const balanced1500Gpu = getCurrentGpuRecommendations({
  budgetUSD: 1500,
  resolution: '1080',
  hz: 144,
  goal: 'fps',
  currentGpuScore: 4,
  cpuScore: 7,
  psuMaxScore: 9,
});
assert.equal(balanced1500Gpu.nvidia.name, 'RTX 5070');
assert.equal(balanced1500Gpu.amd.name, 'RX 9070');
assert.equal(balanced1500Gpu.targetScore, 8);

const highEnd4kGpu = getCurrentGpuRecommendations({
  budgetUSD: 2000,
  resolution: '4k',
  hz: 144,
  goal: 'visuals',
  currentGpuScore: 7,
  cpuScore: 9,
  psuMaxScore: 10,
});
assert.equal(highEnd4kGpu.nvidia.name, 'RTX 5080');
assert.equal(highEnd4kGpu.amd.name, 'RX 9070 XT');

const cpuLimitedGpu = getCurrentGpuRecommendations({
  budgetUSD: 1500,
  resolution: '1440',
  hz: 165,
  goal: 'fps',
  currentGpuScore: 3,
  cpuScore: 3,
  psuMaxScore: 10,
});
assert.equal(cpuLimitedGpu.targetScore, 7);
assert.equal(cpuLimitedGpu.nvidia.name, 'RTX 5060 Ti');
assert.equal(cpuLimitedGpu.balanceReason, 'cpu');

assert.equal(normalizePartSearch('GTX 1070 Ti'), 'gtx1070ti');

const gtx1070Search = buildPartSearchText('gpu', 'gtx1070', 'GTX 1070');
assert.ok(gtx1070Search.includes('gtx1070'));
assert.ok(gtx1070Search.includes('1070'));
assert.ok(gtx1070Search.includes('geforcegtx1070'));

const rtx2060SuperSearch = buildPartSearchText('gpu', 'rtx2060s', 'RTX 2060 Super');
assert.ok(rtx2060SuperSearch.includes('rtx2060super'));
assert.ok(rtx2060SuperSearch.includes('2060s'));

const cpuSearch = buildPartSearchText('cpu', 'i7_10700k', 'Intel i7-10700K');
assert.ok(cpuSearch.includes('i710700k'));
assert.ok(cpuSearch.includes('10700k'));

assert.equal(
  getBiosRecommendation({
    cpuKey: 'r5_3600',
    bestKey: 'cpu',
    ramSpeedTier: 1,
    isSingleChannel: false,
    oldIntelPlatform: false,
    oldAm4Platform: true,
    isModernIntelHybrid: false,
    unknownCooler: false,
    weakCooler: false,
  }).kind,
  'platform'
);

assert.equal(
  getBiosRecommendation({
    cpuKey: 'i5_9400f',
    bestKey: 'gpu',
    ramSpeedTier: 1,
    isSingleChannel: false,
    oldIntelPlatform: true,
    oldAm4Platform: false,
    isModernIntelHybrid: false,
    unknownCooler: false,
    weakCooler: false,
  }),
  null
);

assert.equal(
  getBiosRecommendation({
    cpuKey: 'i5_12400f',
    bestKey: 'ramspd',
    ramSpeedTier: 0,
    isSingleChannel: false,
    oldIntelPlatform: false,
    oldAm4Platform: false,
    isModernIntelHybrid: false,
    unknownCooler: false,
    weakCooler: false,
  }).kind,
  'memory'
);

const appSource = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const analyzeSource = readFileSync(new URL('../src/analyze.js', import.meta.url), 'utf8');
const wizardSource = readFileSync(new URL('../src/wizard.js', import.meta.url), 'utf8');
const systemTypeSource = readFileSync(new URL('../src/system-type.js', import.meta.url), 'utf8');
const uiPartsSource = readFileSync(new URL('../src/ui-parts.js', import.meta.url), 'utf8');
const resultPageSource = readFileSync(new URL('../src/result-page.js', import.meta.url), 'utf8');
const resultArtworkSource = readFileSync(new URL('../src/result-artwork.js', import.meta.url), 'utf8');
const eventsSource = readFileSync(new URL('../src/events.js', import.meta.url), 'utf8');
const budgetDisplaySource = readFileSync(new URL('../src/budget-display.js', import.meta.url), 'utf8');
const mainSource = [appSource, analyzeSource, wizardSource, systemTypeSource, uiPartsSource, resultPageSource].join('\n');
const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const finalAccentToken = [...styleSource.matchAll(/--accent:([^;]+);/g)].at(-1)?.[1].trim();
const htmlStepOrder = [...indexSource.matchAll(/<section class="wizard-step" data-step="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(htmlStepOrder, ['goal', 'specs', 'budget', 'result'], 'HTML wizard sections should keep system type first and Analyze before result');
assert.ok(styleSource.includes('UpgradePilot visual refresh layer'), 'visual refresh CSS layer should be present');
assert.equal(finalAccentToken, '#69a7ff', 'final primary accent should be calm blue, not neon green');
assert.ok(styleSource.includes('--success:#35d07f'), 'success green should be a dedicated semantic token');
assert.ok(styleSource.includes('--success-soft'), 'success states should have their own soft token');
assert.ok(
  styleSource.includes('background:linear-gradient(180deg,#83bdff 0%,var(--accent) 100%)'),
  'primary CTA should use the blue accent'
);
const finalVisualLayer = styleSource.slice(styleSource.indexOf('/* === UpgradePilot visual refresh layer === */'));
assert.equal(
  /0,228,121|54,242,197|00e479|36f2c5|6cffad|baffd4|ecfff5|e7ffef|83ffbd|8dffd8|f1ffef/.test(finalVisualLayer),
  false,
  'final visual layer should not reintroduce neon green as a generic UI color'
);
assert.ok(styleSource.includes('Virtual PC blue polish'), 'virtual PC should have a dedicated blue polish override');
assert.ok(indexSource.includes('family=DM+Sans'), 'main app should load DM Sans for the warmer UI direction');
assert.ok(indexSource.includes('family=IBM+Plex+Mono'), 'main app should load IBM Plex Mono for restrained technical values');
assert.equal(indexSource.includes('Space+Mono'), false, 'main app should not import Space Mono after the typography refresh');
assert.ok(styleSource.includes("--font-ui:'DM Sans'"), 'CSS should expose DM Sans as the UI font token');
assert.ok(styleSource.includes("--font-tech:'IBM Plex Mono'"), 'CSS should expose IBM Plex Mono as the technical font token');
assert.ok(styleSource.includes('Readability scale pass'), 'CSS should include the final readability scale pass');
assert.ok(styleSource.includes('.wizard-pill{\n  font-size:.82rem;'), 'wizard step labels should be enlarged for readability');
assert.ok(styleSource.includes('.field label,\n.sec-label,'), 'small form and section labels should be covered by the readability scale');
assert.ok(styleSource.includes('Current PC intro blue correction'), 'Current PC intro should override old green active styling');
assert.ok(styleSource.includes('.specs-intro .step-kicker{\n  border-color:rgba(105,167,255,.30);'), 'Current PC step badge should use blue, not green');
assert.ok(styleSource.includes('.step-proof-row span::after{\n  background:var(--accent2);'), 'Current PC proof dots should use blue/cyan, not green');
assert.ok(
  /const WIZARD_STEPS = \[\s+\{ id: 'goal',\s+labelKey: 'stepGoal' \},\s+\{ id: 'specs',\s+labelKey: 'stepSpecs' \},\s+\{ id: 'budget', labelKey: 'stepBudget' \},\s+\{ id: 'result', labelKey: 'stepResult' \},\s+\];/.test(wizardSource),
  'JS wizard step order should match the HTML order so Analyze is reachable predictably'
);
assert.ok(indexSource.includes('src="/src/app.js"'), 'index should use the modular app entry');
assert.ok(indexSource.includes('id="display-detect-feedback"'), 'display detection should expose visible feedback');
assert.ok(indexSource.includes('id="result-part-artwork"'), 'result page should expose a conditional part artwork slot');
assert.ok(indexSource.includes('result-analysis-section'), 'detailed analysis should use concise decision sections');
assert.equal(
  (indexSource.match(/class="result-analysis-section"/g) || []).length,
  3,
  'detailed analysis should contain exactly three visible decision sections'
);
assert.ok(indexSource.includes('id="result-analysis-why"'), 'analysis should explain why the recommendation was made');
assert.ok(indexSource.includes('id="result-analysis-verify"'), 'analysis should show concise verification steps');
assert.ok(indexSource.includes('id="result-analysis-next"'), 'analysis should show concise next steps');
assert.ok(resultArtworkSource.includes('result-gpu-artwork'), 'result artwork module should include a GPU line-art illustration');
assert.ok(resultArtworkSource.includes('result-cpu-artwork'), 'result artwork module should include a CPU line-art illustration');
assert.ok(eventsSource.includes("label = () => inTr(labelEn, labelTr)"), 'dynamic Virtual PC focus labels should follow the active language');
assert.ok(styleSource.includes('/* === Result clarity pass === */'), 'result clarity styles should be present');
assert.ok(styleSource.includes('.result-analysis-legacy{display:none!important}'), 'legacy detailed-analysis clutter should stay hidden');
assert.ok(styleSource.includes('.pc-summary strong{'), 'mobile Virtual PC summaries should have a wrapping rule');
assert.ok(
  budgetDisplaySource.includes("document.querySelectorAll('[data-tg-target=\"res\"]')"),
  'display detection should synchronize the visible resolution toggle'
);
assert.ok(indexSource.includes('id="memory-type-field"'), 'memory type field should have a stable conditional-visibility hook');
assert.ok(
  /<div class="field" data-pc-part="ram">[\s\S]*?<span data-i18n="ramCapacity">[\s\S]*?<select id="ram"/.test(indexSource),
  'RAM capacity should remain an independent always-visible field'
);
assert.ok(
  /<div class="field" id="memory-type-field" data-pc-part="ram">[\s\S]*?<span data-i18n="memoryType">/.test(indexSource),
  'the conditional memory type hook should be attached to the Memory Type field'
);
assert.ok(
  styleSource.includes('.memory-fields:has(#memory-type-field.is-hidden)'),
  'RAM capacity should expand when the memory type choice is hidden'
);
assert.equal(indexSource.includes('src="/src/main.js"'), false, 'index should not load the old monolithic main.js');
assert.ok(appSource.includes('function restoreFromPageCache()'), 'page-cache restore should have a dedicated state-only path');
assert.equal(/if \(event\.persisted\) boot\(/.test(appSource), false, 'page-cache restore should not bind all event listeners again');
assert.ok(
  mainSource.includes("wizard.dataset.currentStep = String(currentWizardStep);"),
  'wizard should expose the current step state for reliable UI/debugging'
);
const activeSelector = mainSource.match(/querySelectorAll\('([^']+)'\)\.forEach\(node => \{\s+const targetPart = node\.dataset\.summaryPart \|\| node\.dataset\.statusPart;/);
assert.ok(activeSelector, 'active-part sync selector should be easy to audit');
assert.equal(
  activeSelector[1].includes('[data-pc-part]'),
  false,
  'active-part sync should not mark every form field in the same part group as active'
);
assert.ok(
  !/<div class="field" data-pc-part="gpu">\s*<label><span data-i18n="gameDrive"/.test(indexSource),
  'game drive should not activate the GPU section in the virtual PC'
);
assert.ok(indexSource.includes('data-pc-label="System type"'), 'system type should map to system focus, not CPU');
assert.ok(indexSource.includes('data-pc-label="Windows settings"'), 'Windows settings should map to system focus');
assert.ok(indexSource.includes('data-pc-label="Game profile"'), 'game profile should map to system focus, not RAM');
assert.ok(indexSource.includes('data-pc-label="Performance goal"'), 'current problem should map to system focus, not RAM');
assert.ok(styleSource.includes('data-active-part="system"'), 'system focus should have a visible virtual PC state');
assert.ok(indexSource.includes('id="pc-summary-power-label"'), 'virtual PC power summary label should be adjustable by system mode');
assert.ok(mainSource.includes("powerLabel.textContent = isLaptopMode ? inTr('Power Mode'"), 'laptop mode should rename power summary away from PSU language');
assert.ok(styleSource.includes('[data-status-part="psu"]{display:none}'), 'laptop mode should hide the PSU status pill');
assert.ok(
  mainSource.includes("control.tagName === 'SELECT'") && mainSource.includes('field-click-cue'),
  'select fields should receive a visible click cue'
);
assert.ok(
  /function buildUpgradePath\(\) \{\s+if \(isLaptop\) return \[\];/.test(mainSource),
  'laptop mode should not render desktop upgrade-path cards'
);
assert.ok(indexSource.includes('data-system-mode="laptop"'), 'laptop CPU/GPU option groups should be present');
assert.ok(indexSource.includes('Intel i7-12700H'), 'common laptop CPUs should be selectable');
assert.ok(indexSource.includes('RTX 4060 Laptop'), 'common laptop GPUs should be selectable');
assert.ok(mainSource.includes('applySystemModeToPartSelects'), 'system mode should filter CPU/GPU options');
assert.equal(
  uiPartsSource.includes('firstAvailablePartOption'),
  false,
  'system mode filtering must not auto-select the first CPU or GPU'
);
assert.ok(
  /if \(!isOptionAvailableForCurrentMode\(select\.selectedOptions\?\.\[0\]\)\) \{\s+select\.value = '';\s+\}/.test(uiPartsSource),
  'system mode filtering should return incompatible CPU/GPU selections to the empty placeholder'
);
assert.ok(mainSource.includes('Laptop cooling pad / stand'), 'laptop mode should recommend practical cooling accessories');
assert.ok(mainSource.includes('Power mode checked'), 'laptop buying trust row should avoid desktop PSU wording');
assert.ok(mainSource.includes('Compare complete laptop classes only after checking temperatures'), 'laptop budget copy should give practical next checks');
assert.ok(mainSource.includes('psuDependencyActive'), 'desktop PSU dependency should be centralized');
assert.ok(mainSource.includes('Resolve PSU readiness before buying a stronger GPU'), 'PSU blocker should clearly come before GPU purchase');
assert.ok(mainSource.includes('PSU blocks GPU path'), 'result trust row should expose PSU dependency when it blocks the GPU path');
assert.ok(mainSource.includes('Do not count GPU gains yet. Resolve PSU readiness first'), 'PSU blockers should suppress aggressive GPU gain estimates');
assert.ok(mainSource.includes('Confidence-limited estimate: enter PSU wattage'), 'missing PSU wattage should reduce gain confidence');
assert.ok(mainSource.includes('throttling can hide the real gain'), 'unknown cooling should reduce gain confidence');
assert.ok(
  ANALYSIS_SEQUENCE_MS >= 2000 && ANALYSIS_SEQUENCE_MS <= 3000,
  'analysis sequence should feel brief, between 2s and 3s'
);
assert.ok(ANALYSIS_SEQUENCE_MS >= 2800, 'analysis should remain visible long enough to feel deliberate');
const enAnalysisMessages = getAnalysisMessages('en');
const trAnalysisMessages = getAnalysisMessages('tr');
assert.ok(enAnalysisMessages.length >= 6, 'English analysis sequence should have enough message variety');
assert.ok(trAnalysisMessages.length >= 6, 'Turkish analysis sequence should have enough message variety');
assert.ok(enAnalysisMessages.includes('Reading your system profile and performance goals...'));
assert.ok(enAnalysisMessages.includes('Comparing CPU and GPU balance for your target...'));
assert.ok(enAnalysisMessages.includes('Checking memory, storage, cooling, and power limits...'));
assert.ok(enAnalysisMessages.includes('Looking for practical free optimizations before buying...'));
assert.ok(enAnalysisMessages.includes('Building your prioritized upgrade decision...'));
assert.ok(trAnalysisMessages.includes('Sistem profiliniz ve performans hedefleriniz okunuyor...'));
assert.ok(trAnalysisMessages.includes('Hedefiniz icin CPU ve GPU dengesi karsilastiriliyor...'));
assert.ok(enAnalysisMessages.every(message => message.length >= 44), 'English analysis messages should explain meaningful diagnostic work');
assert.ok(trAnalysisMessages.includes('Önceliklendirilmiş yükseltme kararınız hazırlanıyor...'));
assert.ok(trAnalysisMessages.every(message => message.length >= 44), 'Turkish analysis messages should explain meaningful diagnostic work');
assert.equal(enAnalysisMessages.some(message => /^loading/i.test(message)), false);
assert.equal(enAnalysisMessages.some(message => /parts|shopping/i.test(message)), false);
assert.ok(indexSource.includes('id="analysis-message"'), 'loading card should expose a dynamic analysis message node');
assert.ok(indexSource.includes('Optimize first. Upgrade smart.'), 'loading card should reinforce the product promise');
assert.ok(
  indexSource.includes('<button type="button" class="btn" data-action="analyze"'),
  'analyze button should be a non-submit button for reliable repeated runs'
);
assert.ok(
  appSource.includes('onRerun: () => analyze()'),
  'result rerun should use the normal loading sequence through the modular app entry'
);
assert.equal(
  /(?:^|\n)\s*latestResultSummary\s*=/.test(analyzeSource),
  false,
  'modular analyze should not assign imported result state directly'
);
assert.ok(
  analyzeSource.includes('setLatestResultSummary(['),
  'modular analyze should save the result summary through the state setter'
);
assert.ok(
  analyzeSource.indexOf('const fmtTry = value =>') < analyzeSource.indexOf("priceEl.textContent = formatRangeForCurrency"),
  'TRY price rounding should be initialized before the first TRY result price render'
);
assert.ok(
  analyzeSource.indexOf('const cpuEl = safeEl') < analyzeSource.indexOf('if (!skipLoading)'),
  'required input validation should run before the loading sequence starts'
);
assert.equal(
  analyzeSource.includes("showAnalysisError('Please select your RAM capacity before running the analysis.')"),
  false,
  'missing RAM capacity should be handled as form validation, not an analysis failure'
);
assert.ok(analyzeSource.includes("showInputValidation(ramEl, 'Please select your RAM capacity before running the analysis.')"));
assert.ok(styleSource.includes('.field.has-validation-error'), 'missing required inputs should have a visible field validation state');
assert.ok(indexSource.includes('class="g1 current-problem-layout"'), 'current problem should use a compact desktop layout hook');
assert.ok(styleSource.includes('/* === Calm field interaction hierarchy === */'), 'field interaction states should have a final calm override');
assert.ok(
  styleSource.includes('.field.has-value:not(.is-field-active):not(:focus-within)'),
  'selected fields should have a restrained persistent state'
);
assert.ok(
  styleSource.includes('.field:hover:not(.is-field-active):not(:focus-within)'),
  'inactive hover should use a dedicated restrained state'
);
assert.ok(
  analyzeSource.includes('const isBuyLaptop = isLaptop;'),
  'laptop mode should always route purchasing toward laptop options'
);
assert.ok(
  analyzeSource.includes("const showFpsDelta = best.score > 1 && (best.key === 'gpu' || best.key === 'cpu');"),
  'FPS delta should only render for CPU and GPU recommendations'
);
assert.ok(
  analyzeSource.includes("perfDeltaEl.classList.toggle('is-hidden', !showFpsDelta);"),
  'non-FPS upgrades should hide the performance delta container completely'
);
assert.ok(
  analyzeSource.includes("ramcap: '2x16GB ' + ramType.toUpperCase() + ' dual channel kit'"),
  'RAM listing searches should use the selected memory generation'
);
assert.ok(
  analyzeSource.includes("name: '2×16 GB ' + ramType.toUpperCase() + ' dual-channel kit'"),
  'RAM recommendation cards should use the selected memory generation'
);
assert.ok(analyzeSource.includes("inTr('Laptop Options', 'Laptop Seçenekleri')"), 'laptop result sections should use the neutral Laptop Options label');
assert.ok(analyzeSource.includes("inTr('Desktop PC Options', 'Masaüstü PC Seçenekleri')"), 'desktop system alternatives should use the Desktop PC Options label');
assert.ok(
  analyzeSource.includes("if (isLaptop) return buildLaptopOptionCards();"),
  'laptop mode should replace internal part cards with laptop option cards'
);
assert.ok(
  analyzeSource.includes("const upgradeOptionsLabel = isLaptop"),
  'the validated paths heading should adapt to laptop and desktop modes'
);
assert.ok(analyzeSource.includes("const bandDesc = isLaptop ? null"), 'laptop mode should not show internal part price bands');
assert.ok(analyzeSource.includes("const laptopMemorySpec = best.key === 'ramcap'"), 'laptop options should respond to a RAM diagnosis');
assert.ok(styleSource.includes('.res-tier-grid > .laptop-block'), 'laptop options should span the result options grid');
assert.ok(analyzeSource.includes("recBadgeLabel.textContent = isLaptop"), 'the result badge should adapt to laptop options');
assert.equal(
  analyzeSource.includes("name:'RTX 3060 / RTX 4060'"),
  false,
  'current-generation recommendation cards should not hard-code RTX 3060 / RTX 4060'
);
assert.ok(analyzeSource.includes("8: 'RTX 5070 / RX 9070 class'"), 'GPU target labels should use current-generation parts');
assert.ok(analyzeSource.includes("cpu: 'Ryzen 7 9800X3D / Ryzen 7 9700X'"), 'performance build should use current-generation CPUs');
assert.ok(analyzeSource.includes("gpu: 'RTX 5070 Ti / RX 9070 XT'"), 'performance build should use current-generation GPUs');
assert.ok(styleSource.includes('Analysis sequence stability for longer diagnostic messages'), 'longer analysis messages should have stable layout styling');
assert.ok(
  /if \(!skipLoading\) \{[\s\S]*goToWizardStep\(WIZARD_STEPS\.length - 2, false\);[\s\S]*startAnalysisSequence\(\(\) => analyze\(true\)\);/.test(mainSource),
  'normal analysis should move back to the budget/loading step before showing the loader'
);
assert.ok(
  /const r = el\('result'\);\s+r\.classList\.add\('show'\);\s+showResultStep\(\);/.test(mainSource),
  'result reveal should add the show class before switching to the result step'
);
[
  'Disable unnecessary startup apps in Task Manager.',
  'Use Balanced power mode and make sure Power Saver is off.',
  'Plug in the charger and enable Windows or OEM performance mode.',
  'Set your monitor to its maximum refresh rate in Windows.',
  'Close unused browsers, launchers, recording tools, and overlays before gaming.',
  'Enable XMP or EXPO in BIOS, then verify the RAM speed in CPU-Z.',
].forEach(requiredAction => {
  assert.ok(mainSource.includes(requiredAction), 'free fixes should include: ' + requiredAction);
});
[
  'Clearing temporary files is useful for storage maintenance',
  'Close heavy background apps before launching',
  'Switch your plan to High performance',
].forEach(rejectedAction => {
  assert.equal(mainSource.includes(rejectedAction), false, 'free fixes should reject low-value wording: ' + rejectedAction);
});
assert.equal(mainSource.includes('items.length < 6'), false, 'free fixes should not have an arbitrary six-item cap');
assert.ok(
  /function buildPolishedFreeChecks\(\) \{[\s\S]*checks\.forEach\(item =>/.test(mainSource),
  'the visible free fixes panel should use the conditional checklist'
);

console.log('polish smoke checks passed');
