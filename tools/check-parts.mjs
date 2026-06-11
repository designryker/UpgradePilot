// Cross-check: CPU_TIER ↔ CPU_SCORE ve GPU_TIER ↔ GPU_SCORE
// Run: node tools/check-parts.mjs
import { readFileSync } from 'fs';

const src = readFileSync('./src/parts-data.js', 'utf8');

function extractKeys(blockName) {
  const m = src.match(new RegExp('export const ' + blockName + '\\s*=\\s*\\{([\\s\\S]*?)\\};'));
  if (!m) return [];
  return [...m[1].matchAll(/(\w+)\s*:/g)]
    .map(x => x[1])
    .filter(k => !['tier','desc_en','desc_tr'].includes(k));
}

const CPU_SCORE = extractKeys('CPU_SCORE');
const CPU_TIER  = extractKeys('CPU_TIER');
const GPU_SCORE = extractKeys('GPU_SCORE');
const GPU_TIER  = extractKeys('GPU_TIER');

const cpuOnlyTier  = CPU_TIER.filter(k => !CPU_SCORE.includes(k));
const cpuOnlyScore = CPU_SCORE.filter(k => !CPU_TIER.includes(k));
const gpuOnlyTier  = GPU_TIER.filter(k => !GPU_SCORE.includes(k));
const gpuOnlyScore = GPU_SCORE.filter(k => !GPU_TIER.includes(k));

let ok = true;

if (cpuOnlyTier.length)  { console.error('⚠ CPU in TIER but not SCORE (will produce NaN):', cpuOnlyTier); ok = false; }
if (cpuOnlyScore.length) { console.warn ('ℹ CPU in SCORE but not TIER (no badge):',          cpuOnlyScore); }
if (gpuOnlyTier.length)  { console.error('⚠ GPU in TIER but not SCORE (will produce NaN):', gpuOnlyTier); ok = false; }
if (gpuOnlyScore.length) { console.warn ('ℹ GPU in SCORE but not TIER (no badge):',          gpuOnlyScore); }

if (ok) {
  console.log('✓ All parts maps consistent');
  console.log('  CPU:', CPU_SCORE.length, 'entries | GPU:', GPU_SCORE.length, 'entries');
}

process.exit(ok ? 0 : 1);
