// ── GPU Auto-detect via WebGL ─────────────────────────────────────────
// WebGL WEBGL_debug_renderer_info returns the real GPU string.
// We normalize it and match against known GPU_SCORE keys.

// Map of search patterns → option value
// Ordered from most specific to least specific (first match wins)
const GPU_PATTERNS = [
  // ── NVIDIA RTX 50 ──────────────────────────────────────────────────
  [/rtx\s*5090/i,          'rtx5090'],
  [/rtx\s*5080/i,          'rtx5080'],
  [/rtx\s*5070\s*ti/i,     'rtx5070ti'],
  [/rtx\s*5070/i,          'rtx5070'],
  [/rtx\s*5060\s*ti/i,     'rtx5060ti'],
  [/rtx\s*5060/i,          'rtx5060'],
  [/rtx\s*5050/i,          'rtx5050'],
  // ── NVIDIA RTX 40 ──────────────────────────────────────────────────
  [/rtx\s*4090/i,          'rtx4090'],
  [/rtx\s*4080\s*super/i,  'rtx4080s'],
  [/rtx\s*4080/i,          'rtx4080'],
  [/rtx\s*4070\s*ti\s*super/i, 'rtx4070tis'],
  [/rtx\s*4070\s*ti/i,     'rtx4070ti'],
  [/rtx\s*4070\s*super/i,  'rtx4070s'],
  [/rtx\s*4070/i,          'rtx4070'],
  [/rtx\s*4060\s*ti/i,     'rtx4060ti'],
  [/rtx\s*4060/i,          'rtx4060'],
  // ── NVIDIA RTX 30 ──────────────────────────────────────────────────
  [/rtx\s*3090/i,          'rtx3090'],
  [/rtx\s*3080\s*ti/i,     'rtx3080ti'],
  [/rtx\s*3080/i,          'rtx3080'],
  [/rtx\s*3070\s*ti/i,     'rtx3070ti'],
  [/rtx\s*3070/i,          'rtx3070'],
  [/rtx\s*3060\s*ti/i,     'rtx3060ti'],
  [/rtx\s*3060/i,          'rtx3060'],
  [/rtx\s*3050/i,          'rtx3050'],
  // ── NVIDIA RTX 20 ──────────────────────────────────────────────────
  [/rtx\s*2080\s*ti/i,     'rtx2080ti'],
  [/rtx\s*2080/i,          'rtx2080'],
  [/rtx\s*2070\s*super/i,  'rtx2070s'],
  [/rtx\s*2070/i,          'rtx2070'],
  [/rtx\s*2060\s*super/i,  'rtx2060s'],
  [/rtx\s*2060/i,          'rtx2060'],
  // ── NVIDIA GTX 16 ──────────────────────────────────────────────────
  [/gtx\s*1660\s*ti/i,     'gtx1660ti'],
  [/gtx\s*1660\s*super/i,  'gtx1660s'],
  [/gtx\s*1660/i,          'gtx1660'],
  [/gtx\s*1650\s*super/i,  'gtx1650s'],
  [/gtx\s*1650/i,          'gtx1650'],
  // ── NVIDIA GTX 10 ──────────────────────────────────────────────────
  [/gtx\s*1080\s*ti/i,     'gtx1080ti'],
  [/gtx\s*1080/i,          'gtx1080'],
  [/gtx\s*1070\s*ti/i,     'gtx1070ti'],
  [/gtx\s*1070/i,          'gtx1070'],
  [/gtx\s*1060.*3\s*gb/i,  'gtx1060_3gb'],
  [/gtx\s*1060/i,          'gtx1060_6gb'],
  [/gtx\s*1050\s*ti/i,     'gtx1050ti'],
  // ── NVIDIA GTX 9xx ─────────────────────────────────────────────────
  [/gtx\s*980\s*ti/i,      'gtx980ti'],
  [/gtx\s*970/i,           'gtx970'],
  // ── NVIDIA Laptop ──────────────────────────────────────────────────
  [/rtx\s*4080.*laptop/i,  'rtx4080_laptop'],
  [/rtx\s*4070.*laptop/i,  'rtx4070_laptop'],
  [/rtx\s*4060.*laptop/i,  'rtx4060_laptop'],
  [/rtx\s*4050.*laptop/i,  'rtx4050_laptop'],
  [/rtx\s*3070.*laptop/i,  'rtx3070_laptop'],
  [/rtx\s*3060.*laptop/i,  'rtx3060_laptop'],
  [/rtx\s*3050.*laptop/i,  'rtx3050_laptop'],
  [/gtx\s*1660.*ti.*laptop/i, 'gtx1660ti_laptop'],
  [/gtx\s*1650.*laptop/i,  'gtx1650_laptop'],
  // ── AMD RX 9000 ────────────────────────────────────────────────────
  [/rx\s*9070\s*xt/i,      'rx9070xt'],
  [/rx\s*9070\s*gre/i,     'rx9070gre'],
  [/rx\s*9070/i,           'rx9070'],
  [/rx\s*9060\s*xt/i,      'rx9060xt'],
  // ── AMD RX 7000 ────────────────────────────────────────────────────
  [/rx\s*7900\s*xtx/i,     'rx7900xtx'],
  [/rx\s*7900\s*xt/i,      'rx7900xt'],
  [/rx\s*7900\s*gre/i,     'rx7900gre'],
  [/rx\s*7800\s*xt/i,      'rx7800xt'],
  [/rx\s*7700\s*xt/i,      'rx7700xt'],
  [/rx\s*7600\s*xt/i,      'rx7600xt'],
  [/rx\s*7600/i,           'rx7600'],
  // ── AMD RX 6000 ────────────────────────────────────────────────────
  [/rx\s*6950\s*xt/i,      'rx6950xt'],
  [/rx\s*6900\s*xt/i,      'rx6900xt'],
  [/rx\s*6800\s*xt/i,      'rx6800xt'],
  [/rx\s*6800/i,           'rx6800'],
  [/rx\s*6750\s*xt/i,      'rx6750xt'],
  [/rx\s*6700\s*xt/i,      'rx6700xt'],
  [/rx\s*6650\s*xt/i,      'rx6650xt'],
  [/rx\s*6600\s*xt/i,      'rx6600xt'],
  [/rx\s*6600/i,           'rx6600'],
  [/rx\s*6500\s*xt/i,      'rx6500xt'],
  [/rx\s*6400/i,           'rx6400'],
  // ── AMD RX 5000 ────────────────────────────────────────────────────
  [/rx\s*5700\s*xt/i,      'rx5700xt'],
  [/rx\s*5700/i,           'rx5700'],
  [/rx\s*5600\s*xt/i,      'rx5600xt'],
  [/rx\s*5500\s*xt/i,      'rx5500xt'],
  // ── AMD RX 500 ─────────────────────────────────────────────────────
  [/rx\s*590/i,            'rx590'],
  [/rx\s*580/i,            'rx580'],
  [/rx\s*570/i,            'rx570'],
  // ── AMD Laptop ─────────────────────────────────────────────────────
  [/rx\s*7600[ms]/i,       'rx7600s'],
  [/rx\s*6800[ms]/i,       'rx6800m'],
  [/rx\s*6600[ms]/i,       'rx6600m'],
  [/rx\s*5600[ms]/i,       'rx5600m'],
  // ── Intel Arc ──────────────────────────────────────────────────────
  [/arc\s*b580/i,          'arc_b580'],
  [/arc\s*b570/i,          'arc_b570'],
  [/arc\s*a770/i,          'arc_a770'],
  [/arc\s*a750/i,          'arc_a750'],
  [/arc\s*a580/i,          'arc_a580'],
  [/arc\s*a380/i,          'arc_a380'],
];

// ── Read raw GPU string from WebGL ────────────────────────────────────
function getRawGpuString() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    // Clean up common suffixes that confuse matching
    return renderer
      .replace(/\s*\(R\)/gi, '')
      .replace(/\/PCIe\/SSE2/gi, '')
      .replace(/OpenGL Engine/gi, '')
      .replace(/Direct3D.*/gi, '')
      .trim();
  } catch {
    return null;
  }
}

// ── Match raw string to a known GPU key ──────────────────────────────
function matchGpuKey(raw) {
  if (!raw) return null;
  for (const [pattern, key] of GPU_PATTERNS) {
    if (pattern.test(raw)) return key;
  }
  return null;
}

// ── Public: detect and apply to #gpu select ───────────────────────────
export function detectAndApplyGpu({ onSuccess, onNotFound, onError } = {}) {
  try {
    const raw = getRawGpuString();
    if (!raw) {
      onError?.('WebGL is not available in this browser.');
      return;
    }

    const key = matchGpuKey(raw);
    if (!key) {
      onNotFound?.(raw);
      return;
    }

    const select = document.getElementById('gpu');
    if (!select) {
      onError?.('GPU selector not found.');
      return;
    }

    // Check option exists in dropdown
    const option = select.querySelector(`option[value="${key}"]`);
    if (!option) {
      onNotFound?.(raw);
      return;
    }

    select.value = key;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    onSuccess?.(raw, key, option.textContent.trim());
  } catch (err) {
    onError?.(err.message);
  }
}

// ── Export raw string for debugging ──────────────────────────────────
export function getRawGpuInfo() {
  return getRawGpuString();
}
