/* ==============================================================
   RIGPILOT v0.3.2 — Rule-Based Performance & Upgrade Decision Engine
   Goal: Stop users wasting money. Free fixes first, then upgrades.
   ============================================================== */

// ── CPU Performance Scores (approximate gaming benchmark ranking) ──
// 5 = capable entry, 10 = best-in-class
// TODO: Add more CPU models here as the list grows
//   Format: key: score,  e.g. 'r9_7950x3d': 10, 'i9_14900ks': 9
//   Suggested additions: Ryzen 9 7950X3D, Intel i9-14900KS, Core Ultra 9 285K,
//   Ryzen 9 9950X, older models like i7-10700K, Ryzen 5 3600, etc.
export const CPU_SCORE = {
  // AMD AM4 older mainstream
  r5_1600:2, r5_2600:3, r7_2700x:3,

  // AMD AM4
  r3_3100:3, r3_3300x:4, r5_3400g:3, r5_3500x:4,
  r5_3600:4, r5_3600x:4, r7_3700x:5, r5_5500:4, r5_5600:5, r5_5600x:5,
  r7_5700x:6, r7_5700x3d:8, r7_5800x:6, r7_5800x3d:8,
  r9_5900x:7, r9_5950x:7,

  // AMD AM5
  r5_7500f:6, r5_7600:6, r5_7600x:6,
  r7_7700:7, r7_7700x:7, r7_7800x3d:9,
  r9_7900x:8, r9_7950x:8, r9_7950x3d:9,
  r5_9600x:7, r7_9700x:8, r7_9800x3d:10,
  r9_9900x:8, r9_9950x:9, r9_9900x3d:10, r9_9950x3d:10,

  // Intel Core 6th-9th Gen
  i5_6500:2, i5_6600k:3, i7_6700:3, i7_6700k:3,
  i5_7400:2, i5_7600k:3, i7_7700:3, i7_7700k:4,
  i5_8400:3, i5_8600k:4, i7_8700:4, i7_8700k:4,
  i5_9400f:3, i5_9600k:4, i7_9700k:5, i9_9900k:5,

  // Intel Core 10th-14th Gen
  i5_10400:4, i5_10400f:4, i5_10600k:5, i5_11400:4, i5_11400f:4, i5_11600k:5,
  i3_12100f:4, i5_12400:5, i5_12400f:5, i5_12600k:6,
  i5_13400:6, i5_13400f:6, i5_13500:6, i5_13600k:7, i5_13600kf:7, i5_14400f:6, i5_14600k:7,
  i7_10700:5, i7_10700k:5, i7_11700k:6, i7_12700k:7, i7_13700k:8, i7_14700k:8,
  i9_10900k:6, i9_12900k:8, i9_13900k:9, i9_14900k:9, i9_14900ks:9,

  // Intel Core Ultra 200S
  ultra5_245k:7, ultra7_265k:8, ultra9_285k:8,
};

// ── GPU Performance Scores (rasterization gaming, approximate) ──
// 3 = budget 1080p, 10 = current flagship
// TODO: Add more GPU models here as the list grows
//   Format: key: score,  e.g. 'rtx5080': 10, 'rx9700xt': 8
//   Suggested additions: RTX 5000 series, RX 9000 series, older GTX 1000/900 series,
//   Intel Arc A770/A750, RX 6500 XT, GTX 1070, RTX 2070 Super, etc.
export const GPU_SCORE = {
  // NVIDIA GTX 900 / 10 / 16 / RTX 20
  gtx970:2, gtx980ti:3,
  gtx1050ti:1, gtx1060_3gb:2, gtx1060_6gb:2, gtx1070:3, gtx1070ti:3, gtx1080:3, gtx1080ti:4,
  gtx1650:2, gtx1650s:2, gtx1660:3, gtx1660s:3, gtx1660ti:3,
  rtx2060:4, rtx2060s:5, rtx2070:5, rtx2070s:5, rtx2080:6, rtx2080ti:6,

  // NVIDIA RTX 30
  rtx3050:3, rtx3060:5, rtx3060ti:6, rtx3070:7, rtx3070ti:7,
  rtx3080:8, rtx3080ti:8, rtx3090:9,

  // NVIDIA RTX 40 / 50
  rtx4060:5, rtx4060ti:6, rtx4070:8, rtx4070s:9, rtx4070ti:9, rtx4070tis:9,
  rtx4080:10, rtx4080s:10, rtx4090:10,
  rtx5050:4, rtx5060:6, rtx5060ti:7, rtx5070:8, rtx5070ti:9, rtx5080:10, rtx5090:10,

  // AMD Radeon RX 500 / 5000 / 6000
  rx570:2, rx580:2, rx590:2, rx5500xt:3, rx5600xt:3, rx5700:4, rx5700xt:4,
  rx6400:2, rx6500xt:3, rx6600:4, rx6650xt:5, rx6700xt:6, rx6750xt:6,
  rx6800:7, rx6800xt:8, rx6900xt:8, rx6950xt:9,

  // AMD Radeon RX 7000 / 9000
  rx7600:5, rx7600xt:5, rx7700xt:7, rx7800xt:7,
  rx7900gre:8, rx7900xt:9, rx7900xtx:10,
  rx9060xt:6, rx9070gre:8, rx9070:9, rx9070xt:9,

  // Intel Arc
  arc_a380:2, arc_a580:4, arc_a750:5, arc_a770:5, arc_b570:5, arc_b580:6,
};

// ── GPU Hardware Encoder Strength (streaming/recording) ──
// 1=basic, 2=good H.265, 3=excellent (NVENC AV1 / recent AMF)
export const GPU_ENC = {
  // NVIDIA older cards
  gtx970:1, gtx980ti:1,
  gtx1050ti:1, gtx1060_3gb:1, gtx1060_6gb:1, gtx1070:1, gtx1070ti:1, gtx1080:1, gtx1080ti:1,
  gtx1650:1, gtx1650s:1, gtx1660:1, gtx1660s:1, gtx1660ti:1,
  rtx2060:2, rtx2060s:2, rtx2070:2, rtx2070s:2, rtx2080:2, rtx2080ti:2,
  rtx3050:2, rtx3060:2, rtx3060ti:2, rtx3070:2, rtx3070ti:2, rtx3080:2, rtx3080ti:2, rtx3090:2,

  // NVIDIA AV1 generation
  rtx4060:3, rtx4060ti:3, rtx4070:3, rtx4070s:3, rtx4070ti:3, rtx4070tis:3,
  rtx4080:3, rtx4080s:3, rtx4090:3,
  rtx5050:3, rtx5060:3, rtx5060ti:3, rtx5070:3, rtx5070ti:3, rtx5080:3, rtx5090:3,

  // AMD Radeon
  rx570:1, rx580:1, rx590:1, rx5500xt:1, rx5600xt:1, rx5700:1, rx5700xt:1,
  rx6400:1, rx6500xt:1, rx6600:1, rx6650xt:1, rx6700xt:1, rx6750xt:1,
  rx6800:2, rx6800xt:2, rx6900xt:2, rx6950xt:2,
  rx7600:2, rx7600xt:2, rx7700xt:2, rx7800xt:2, rx7900gre:2, rx7900xt:2, rx7900xtx:2,
  rx9060xt:2, rx9070gre:2, rx9070:2, rx9070xt:2,

  // Intel Arc
  arc_a380:2, arc_a580:2, arc_a750:2, arc_a770:2, arc_b570:3, arc_b580:3,
};

// ── PSU: maximum safe GPU score by wattage ──
export function psuMaxGpu(watts) {
  if (!watts || watts < 300) return 0;
  if (watts < 450) return 2;
  if (watts < 550) return 5;
  if (watts < 650) return 6;
  if (watts < 750) return 8;
  if (watts < 850) return 9;
  return 10;
}

// ── RAM speed tier from dropdown value ──
// 0 = slow, 1 = average, 2 = good, 3 = fast
// DDR4: 2400/2666 = slow | 3000/3200 = normal | 3600 = good | 4000+ = fast
// DDR5: 4800/5200 = average | 5600 = decent | 6000/6400/7200+ = good/fast
export function ramSpeedTier(speedVal) {
  const T = {
    ddr4_2400:0, ddr4_2666:0,
    ddr4_3000:1, ddr4_3200:1,
    ddr4_3600:2, ddr4_4000:3,
    ddr5_4800:1, ddr5_5200:1,
    ddr5_5600:2,
    ddr5_6000:3, ddr5_6400:3, ddr5_7200:3,
  };
  return T[speedVal] !== undefined ? T[speedVal] : 1; // fallback to average
}

// ── Estimated upgrade price bands (USD) ──
// [min, max_typical] for rough budget guidance only
export const PRICE_USD = {
  ramcap: [25,  70,  'RAM capacity upgrade (8 → 16 GB)'],
  ramspd: [40,  110, 'RAM speed upgrade (DDR4 3600+ kit)'],
  psu:    [60,  140, 'PSU upgrade (650W+ Gold quality)'],
  cpu_lo: [140, 280, 'CPU upgrade (mid-range tier)'],
  cpu_hi: [280, 520, 'CPU upgrade (high-end tier)'],
  gpu_lo: [200, 420, 'GPU upgrade (mid-range tier)'],
  gpu_mid:[420, 680, 'GPU upgrade (high 1440p tier)'],
  gpu_hi: [680, 1400,'GPU upgrade (4K / flagship tier)'],
};

export const PRICE_TR = {
  ramcap: 'RAM kapasitesi yükseltmesi (8 → 16 GB)',
  ramspd: 'RAM hızı yükseltmesi (DDR4 3600+ kit)',
  psu:    'PSU yükseltmesi (650W+ kaliteli Gold)',
  cpu_lo: 'CPU yükseltmesi (orta seviye)',
  cpu_hi: 'CPU yükseltmesi (üst seviye)',
  gpu_lo: 'GPU yükseltmesi (orta seviye)',
  gpu_mid:'GPU yükseltmesi (güçlü 1440p seviyesi)',
  gpu_hi: 'GPU yükseltmesi (4K / amiral gemisi seviye)',
};
