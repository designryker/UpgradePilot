import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost/' });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.setTimeout = () => 0;
globalThis.setTimeout = () => 0;

const { analyze } = await import('../src/analyze.js');
const { applySystemModeToPartSelects } = await import('../src/ui-parts.js');
const { bindEvents } = await import('../src/events.js');
const { setCurrentLang } = await import('../src/state.js');

for (const id of ['system-type', 'os-version', 'game-drive', 'goal', 'game', 'res', 'hz', 'cpu', 'gpu', 'ram', 'ram-type', 'ram-speed', 'channel']) {
  assert.equal(document.getElementById(id)?.value, '', `#${id} should start without a user selection`);
}
assert.equal(document.querySelectorAll('.tg-btn.tg-active').length, 0, 'toggle buttons should start unselected');

setValue('system-type', 'desktop');
applySystemModeToPartSelects();
assert.equal(document.getElementById('cpu').value, '', 'desktop mode should not auto-select a CPU');
assert.equal(document.getElementById('gpu').value, '', 'desktop mode should not auto-select a GPU');
setValue('system-type', 'laptop');
applySystemModeToPartSelects();
assert.equal(document.getElementById('cpu').value, '', 'laptop mode should not auto-select a CPU');
assert.equal(document.getElementById('gpu').value, '', 'laptop mode should not auto-select a GPU');
bindEvents();
setCurrentLang('tr');
document.getElementById('gpu-search').dispatchEvent(new Event('focus'));
assert.equal(document.getElementById('pc-visual-label').textContent, 'Ekran kartı arama', 'dynamic Virtual PC labels should follow Turkish mode');
setCurrentLang('en');

const defaults = {
  'system-type': 'desktop',
  'os-version': 'win11',
  'game-drive': 'nvme',
  'cpu-cooler': 'tower_air',
  goal: 'fps',
  game: 'mixed',
  res: '1080',
  hz: '144',
  cpu: 'r5_5600',
  gpu: 'rtx3060',
  ram: '16',
  'ram-type': 'ddr4',
  'ram-speed': 'ddr4_3200',
  channel: 'dual',
  'psu-watts': '750',
  'psu-unknown-check': false,
  budget: '1000',
  currency: 'usd',
};

const scenarios = [
  {
    name: '8 GB RAM is the first priority',
    input: { ram: '8', gpu: 'rtx3060ti' },
    diagnosis: 'RAM Limited',
    upgrade: 'RAM Capacity',
  },
  {
    name: 'single-channel memory blocks paid upgrades',
    input: { ram: '16', channel: 'single', gpu: 'rtx4070' },
    diagnosis: 'RAM Config Issue',
    upgrade: 'Fix RAM Configuration First',
    product: 'Fix RAM Configuration First',
    tierSectionHidden: true,
    priceRowHidden: true,
  },
  {
    name: 'dangerously weak PSU is first priority',
    input: { cpu: 'r7_7800x3d', gpu: 'rtx4080', 'psu-watts': '500', ram: '32', 'ram-type': 'ddr5', 'ram-speed': 'ddr5_6000', res: '4k' },
    diagnosis: 'PSU Risk',
    upgrade: 'Power Supply (PSU)',
  },
  {
    name: 'old GPU at 1440p AAA recommends GPU',
    input: { cpu: 'r7_7800x3d', gpu: 'gtx1660s', ram: '32', 'ram-type': 'ddr5', 'ram-speed': 'ddr5_6000', res: '1440', game: 'aaa', goal: 'visuals' },
    diagnosis: 'GPU Limited',
    upgrade: 'Graphics Card (GPU)',
    artwork: 'gpu',
  },
  {
    name: 'old CPU with strong GPU at high-refresh recommends CPU',
    input: { cpu: 'i7_7700k', gpu: 'rtx4070', ram: '32', res: '1080', hz: '360', game: 'compfps', goal: 'latency' },
    diagnosis: 'CPU Limited',
    upgrade: 'Processor (CPU)',
    artwork: 'cpu',
  },
  {
    name: 'balanced modern 1440p system avoids a forced purchase',
    input: { cpu: 'r7_7800x3d', gpu: 'rtx4070s', ram: '32', 'ram-type': 'ddr5', 'ram-speed': 'ddr5_6000', res: '1440', hz: '144', game: 'mixed', goal: 'none' },
    diagnosis: 'Optimize First',
    upgrade: 'No Hardware Upgrade Yet',
  },
  {
    name: 'slow RAM on a strong competitive system recommends memory speed',
    input: { cpu: 'i5_13600kf', gpu: 'rtx4070', ram: '32', 'ram-speed': 'ddr4_2400', res: '1080', hz: '360', game: 'compfps', goal: 'latency' },
    upgrade: 'RAM Speed',
  },
  {
    name: 'cheap goal with 8 GB still prioritizes RAM',
    input: { cpu: 'i5_9400f', gpu: 'gtx1660s', ram: '8', budget: '100', goal: 'cheap' },
    diagnosis: 'RAM Limited',
    upgrade: 'RAM Capacity',
  },
  {
    name: '4K gaming on a midrange GPU recommends GPU',
    input: { cpu: 'r7_7800x3d', gpu: 'rtx4060ti', ram: '32', 'ram-type': 'ddr5', 'ram-speed': 'ddr5_6000', res: '4k', hz: '60', game: 'aaa', goal: 'visuals', 'psu-watts': '850' },
    diagnosis: 'GPU Limited',
    upgrade: 'Graphics Card (GPU)',
  },
  {
    name: 'streaming with an old CPU and encoder recommends CPU',
    input: { cpu: 'r5_2600', gpu: 'gtx1660s', ram: '32', game: 'stream', goal: 'stream' },
    diagnosis: 'CPU Limited',
    upgrade: 'Processor (CPU)',
  },
  {
    name: 'laptop internal CPU and GPU are not offered as upgrades',
    input: { 'system-type': 'laptop', cpu: 'i5_10300h', gpu: 'gtx1650_laptop', ram: '16', game: 'aaa', res: '1080', goal: 'fps', 'psu-watts': '0' },
    upgrade: 'Laptop Options',
    product: 'Laptop Options',
    artwork: '',
  },
  {
    name: 'laptop with 8 GB prioritizes RAM but still offers laptop options',
    input: { 'system-type': 'laptop', cpu: 'i5_10300h', gpu: 'gtx1650_laptop', ram: '8', game: 'aaa', res: '1080', goal: 'smooth', 'psu-watts': '0' },
    diagnosis: 'RAM Limited',
    upgrade: 'Laptop Options',
    product: 'Laptop Options',
    artwork: '',
  },
  {
    name: 'unknown PSU does not invent a PSU safety diagnosis',
    input: { cpu: 'r7_7800x3d', gpu: 'gtx1660s', ram: '32', 'ram-type': 'ddr5', 'ram-speed': 'ddr5_6000', res: '1440', game: 'aaa', goal: 'visuals', 'psu-unknown-check': true },
    notDiagnosis: 'PSU Risk',
    confidence: 'Medium',
  },
  {
    name: 'TRY budget completes without an analysis error',
    input: { cpu: 'r5_5600', gpu: 'gtx1660s', budget: '50000', currency: 'try', res: '1440', game: 'aaa' },
    noError: true,
  },
  {
    name: 'current flagship-class system avoids GPU replacement',
    input: { cpu: 'r7_9800x3d', gpu: 'rtx5080', ram: '32', 'ram-type': 'ddr5', 'ram-speed': 'ddr5_6000', res: '4k', hz: '144', game: 'aaa', goal: 'visuals', 'psu-watts': '1000' },
    notUpgrade: 'Graphics Card (GPU)',
    artwork: '',
  },
];

function setValue(id, value) {
  const node = document.getElementById(id);
  assert.ok(node, `missing scenario input #${id}`);
  if (node.type === 'checkbox') node.checked = Boolean(value);
  else node.value = String(value);
}

function text(id) {
  return document.getElementById(id)?.textContent?.trim() || '';
}

function runScenario(scenario) {
  Object.entries({ ...defaults, ...scenario.input }).forEach(([id, value]) => setValue(id, value));
  document.getElementById('loading-card').innerHTML = '';
  analyze(true);

  const result = {
    name: scenario.name,
    diagnosis: text('diag-pill'),
    upgrade: text('uname'),
    product: text('res-product-name'),
    priority: text('upgrade-priority-value'),
    confidence: text('confidence-value'),
    error: document.querySelector('.analysis-error-msg')?.textContent?.trim() || '',
    artwork: document.getElementById('result-part-artwork')?.dataset.artwork || '',
    tierSectionHidden: document.querySelector('.res-tier-section')?.classList.contains('is-hidden') || false,
    priceRowHidden: document.querySelector('.res-price-row')?.classList.contains('is-hidden') || false,
    verifyCount: document.querySelectorAll('#result-analysis-verify li').length,
    nextCount: document.querySelectorAll('#result-analysis-next li').length,
  };

  if (scenario.diagnosis) assert.equal(result.diagnosis, scenario.diagnosis, scenario.name);
  if (scenario.upgrade) assert.equal(result.upgrade, scenario.upgrade, scenario.name);
  if (scenario.product) assert.equal(result.product, scenario.product, scenario.name);
  if (scenario.confidence) assert.equal(result.confidence, scenario.confidence, scenario.name);
  if (scenario.artwork !== undefined) assert.equal(result.artwork, scenario.artwork, scenario.name);
  if (scenario.tierSectionHidden !== undefined) assert.equal(result.tierSectionHidden, scenario.tierSectionHidden, scenario.name);
  if (scenario.priceRowHidden !== undefined) assert.equal(result.priceRowHidden, scenario.priceRowHidden, scenario.name);
  assert.ok(result.verifyCount > 0 && result.verifyCount <= 3, `${scenario.name}: verification list should stay concise`);
  assert.ok(result.nextCount > 0 && result.nextCount <= 3, `${scenario.name}: next-step list should stay concise`);
  if (scenario.notDiagnosis) assert.notEqual(result.diagnosis, scenario.notDiagnosis, scenario.name);
  if (scenario.notUpgrade) assert.notEqual(result.upgrade, scenario.notUpgrade, scenario.name);
  if (scenario.noError) assert.equal(result.error, '', scenario.name);

  return result;
}

const results = scenarios.map(runScenario);
console.table(results);
console.log(`Recommendation scenarios passed: ${results.length}/${scenarios.length}`);
