import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ANALYSIS_SEQUENCE_MS,
  buildPartSearchText,
  getAnalysisMessages,
  getBiosRecommendation,
  normalizePartSearch,
} from '../src/recommendation-helpers.js';

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
const mainSource = [appSource, analyzeSource, wizardSource, systemTypeSource, uiPartsSource].join('\n');
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
  'Enable XMP/EXPO',
  'Update GPU and chipset drivers',
  'Check CPU/GPU temperatures',
  'Move the game to SSD/NVMe',
  'Close heavy background apps and overlays',
  'Retest before upgrading',
].forEach(requiredAction => {
  assert.ok(mainSource.includes(requiredAction), 'free fixes should include: ' + requiredAction);
});

console.log('polish smoke checks passed');
