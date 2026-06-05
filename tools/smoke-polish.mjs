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

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
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
assert.ok(
  mainSource.includes("control.tagName === 'SELECT'") && mainSource.includes('field-click-cue'),
  'select fields should receive a visible click cue'
);
assert.ok(
  /function buildUpgradePath\(\) \{\s+if \(isLaptop\) return \[\];/.test(mainSource),
  'laptop mode should not render desktop upgrade-path cards'
);
assert.ok(
  ANALYSIS_SEQUENCE_MS >= 2000 && ANALYSIS_SEQUENCE_MS <= 3000,
  'analysis sequence should feel brief, between 2s and 3s'
);
const enAnalysisMessages = getAnalysisMessages('en');
const trAnalysisMessages = getAnalysisMessages('tr');
assert.ok(enAnalysisMessages.length >= 6, 'English analysis sequence should have enough message variety');
assert.ok(trAnalysisMessages.length >= 6, 'Turkish analysis sequence should have enough message variety');
assert.ok(enAnalysisMessages.includes('Analyzing your system...'));
assert.ok(enAnalysisMessages.includes('Checking CPU and GPU balance...'));
assert.ok(enAnalysisMessages.includes('Looking for performance bottlenecks...'));
assert.ok(enAnalysisMessages.includes('Searching for free optimizations...'));
assert.ok(enAnalysisMessages.includes('Building your upgrade decision...'));
assert.ok(trAnalysisMessages.includes('Sisteminiz analiz ediliyor...'));
assert.ok(trAnalysisMessages.includes('CPU ve GPU dengesi kontrol ediliyor...'));
assert.ok(trAnalysisMessages.includes('Yükseltme kararınız hazırlanıyor...'));
assert.equal(enAnalysisMessages.some(message => /^loading/i.test(message)), false);
assert.equal(enAnalysisMessages.some(message => /parts|shopping/i.test(message)), false);
assert.ok(indexSource.includes('id="analysis-message"'), 'loading card should expose a dynamic analysis message node');
assert.ok(indexSource.includes('Optimize first. Upgrade smart.'), 'loading card should reinforce the product promise');
assert.ok(
  /el\('result-rerun'\)\?\.addEventListener\('click', \(\) => analyze\(\)\);/.test(mainSource),
  'result rerun should use the normal loading sequence so repeated analysis works'
);
assert.ok(
  /if \(!skipLoading\) \{[\s\S]*goToWizardStep\(WIZARD_STEPS\.length - 2, false\);[\s\S]*startAnalysisSequence\(\(\) => analyze\(true\)\);/.test(mainSource),
  'normal analysis should move back to the budget/loading step before showing the loader'
);
assert.ok(
  mainSource.includes("r.classList.add('show')"),
  'result reveal should add the show class without replacing the result element class list'
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
