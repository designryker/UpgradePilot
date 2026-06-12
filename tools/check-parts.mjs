// Cross-check part metadata maps.
// Run: node tools/check-parts.mjs
import { readFileSync } from 'fs';

const src = readFileSync('./src/parts-data.js', 'utf8');

function extractKeys(blockName) {
  const match = src.match(new RegExp('export const ' + blockName + '\\s*=\\s*\\{([\\s\\S]*?)\\};'));
  if (!match) return [];
  return [...match[1].matchAll(/(\w+)\s*:/g)]
    .map(item => item[1])
    .filter(key => !['tier', 'desc_en', 'desc_tr'].includes(key));
}

const CPU_SCORE = extractKeys('CPU_SCORE');
const CPU_TIER = extractKeys('CPU_TIER');
const CPU_MEMORY_MODE = extractKeys('CPU_MEMORY_MODE');
const GPU_SCORE = extractKeys('GPU_SCORE');
const GPU_TIER = extractKeys('GPU_TIER');

const cpuOnlyTier = CPU_TIER.filter(key => !CPU_SCORE.includes(key));
const cpuOnlyScore = CPU_SCORE.filter(key => !CPU_TIER.includes(key));
const gpuOnlyTier = GPU_TIER.filter(key => !GPU_SCORE.includes(key));
const gpuOnlyScore = GPU_SCORE.filter(key => !GPU_TIER.includes(key));
const cpuMissingMemoryMode = CPU_SCORE.filter(key => !CPU_MEMORY_MODE.includes(key));
const memoryModeWithoutCpu = CPU_MEMORY_MODE.filter(key => !CPU_SCORE.includes(key));

let ok = true;

if (cpuOnlyTier.length) { console.error('CPU in TIER but not SCORE:', cpuOnlyTier); ok = false; }
if (cpuOnlyScore.length) console.warn('CPU in SCORE but not TIER:', cpuOnlyScore);
if (gpuOnlyTier.length) { console.error('GPU in TIER but not SCORE:', gpuOnlyTier); ok = false; }
if (gpuOnlyScore.length) console.warn('GPU in SCORE but not TIER:', gpuOnlyScore);
if (cpuMissingMemoryMode.length) { console.error('CPU missing explicit memory mode:', cpuMissingMemoryMode); ok = false; }
if (memoryModeWithoutCpu.length) { console.error('Memory mode without CPU score:', memoryModeWithoutCpu); ok = false; }

if (ok) {
  console.log('All parts maps consistent');
  console.log('  CPU:', CPU_SCORE.length, 'entries | GPU:', GPU_SCORE.length, 'entries');
}

process.exit(ok ? 0 : 1);
