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
  r5_7500f:6, r5_7600:6, r5_7600x:6, r5_7600x3d:7,
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

  // Laptop CPUs — approximate sustained gaming class, cooling dependent
  i5_10300h:3, i5_11400h:4, i5_12500h:6, i5_13500h:6,
  i7_10750h:4, i7_11800h:5, i7_12700h:7, i7_13700h:7,
  r5_4600h:4, r5_5600h:5, r7_5800h:6, r7_6800h:6,
  r7_7735hs:6, r7_7840hs:7, r9_7940hs:7,
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

  // Laptop GPUs — approximate real-world class, wattage/cooling dependent
  gtx1650_laptop:2, gtx1660ti_laptop:3,
  rtx3050_laptop:3, rtx3060_laptop:5, rtx3070_laptop:6,
  rtx4050_laptop:4, rtx4060_laptop:6, rtx4070_laptop:7, rtx4080_laptop:9,
  rx5600m:4, rx6600m:5, rx6800m:7, rx7600s:5,
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

  // Laptop GPUs
  gtx1650_laptop:1, gtx1660ti_laptop:1,
  rtx3050_laptop:2, rtx3060_laptop:2, rtx3070_laptop:2,
  rtx4050_laptop:3, rtx4060_laptop:3, rtx4070_laptop:3, rtx4080_laptop:3,
  rx5600m:1, rx6600m:1, rx6800m:2, rx7600s:2,
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

// ── Tier labels for instant visual feedback on part selection ──
// Format: { tier, desc_en, desc_tr }
// tier: 'entry' | 'mid' | 'upper-mid' | 'high-end' | 'flagship'
export const CPU_TIER = {
  // AMD AM4 older
  r5_1600:   { tier:'entry',     desc_en:'Entry · AM4 · DDR4',           desc_tr:'Giriş · AM4 · DDR4' },
  r5_2600:   { tier:'entry',     desc_en:'Entry · AM4 · DDR4',           desc_tr:'Giriş · AM4 · DDR4' },
  r7_2700x:  { tier:'entry',     desc_en:'Entry · AM4 · DDR4',           desc_tr:'Giriş · AM4 · DDR4' },
  // AMD AM4
  r3_3100:   { tier:'entry',     desc_en:'Budget · AM4 · DDR4',          desc_tr:'Uygun · AM4 · DDR4' },
  r3_3300x:  { tier:'entry',     desc_en:'Budget · AM4 · DDR4',          desc_tr:'Uygun · AM4 · DDR4' },
  r5_3400g:  { tier:'entry',     desc_en:'Entry APU · AM4 · DDR4',       desc_tr:'Giriş APU · AM4 · DDR4' },
  r5_3500x:  { tier:'entry',     desc_en:'Budget · AM4 · DDR4',          desc_tr:'Uygun · AM4 · DDR4' },
  r5_3600:   { tier:'mid',       desc_en:'Mid-range · AM4 · DDR4',       desc_tr:'Orta seviye · AM4 · DDR4' },
  r5_3600x:  { tier:'mid',       desc_en:'Mid-range · AM4 · DDR4',       desc_tr:'Orta seviye · AM4 · DDR4' },
  r7_3700x:  { tier:'mid',       desc_en:'Upper-mid · AM4 · DDR4',       desc_tr:'Orta-üst · AM4 · DDR4' },
  r5_5500:   { tier:'mid',       desc_en:'Mid-range · AM4 · DDR4',       desc_tr:'Orta seviye · AM4 · DDR4' },
  r5_5600:   { tier:'mid',       desc_en:'Mid-range · AM4 · DDR4',       desc_tr:'Orta seviye · AM4 · DDR4' },
  r5_5600x:  { tier:'mid',       desc_en:'Mid-range · AM4 · DDR4',       desc_tr:'Orta seviye · AM4 · DDR4' },
  r7_5700x:  { tier:'upper-mid', desc_en:'Upper-mid · AM4 · DDR4',       desc_tr:'Orta-üst · AM4 · DDR4' },
  r7_5700x3d:{ tier:'high-end',  desc_en:'High-end · AM4 · 3D V-Cache',  desc_tr:'Üst seviye · AM4 · 3D V-Cache' },
  r7_5800x:  { tier:'upper-mid', desc_en:'Upper-mid · AM4 · DDR4',       desc_tr:'Orta-üst · AM4 · DDR4' },
  r7_5800x3d:{ tier:'high-end',  desc_en:'High-end · AM4 · 3D V-Cache',  desc_tr:'Üst seviye · AM4 · 3D V-Cache' },
  r9_5900x:  { tier:'high-end',  desc_en:'High-end · AM4 · DDR4',        desc_tr:'Üst seviye · AM4 · DDR4' },
  r9_5950x:  { tier:'high-end',  desc_en:'High-end · AM4 · DDR4',        desc_tr:'Üst seviye · AM4 · DDR4' },
  // AMD AM5
  r5_7500f:  { tier:'mid',       desc_en:'Mid-range · AM5 · DDR5',       desc_tr:'Orta seviye · AM5 · DDR5' },
  r5_7600:   { tier:'mid',       desc_en:'Mid-range · AM5 · DDR5',       desc_tr:'Orta seviye · AM5 · DDR5' },
  r5_7600x:  { tier:'mid',       desc_en:'Mid-range · AM5 · DDR5',       desc_tr:'Orta seviye · AM5 · DDR5' },
  r5_7600x3d:{ tier:'upper-mid', desc_en:'Upper-mid · AM5 · 3D V-Cache', desc_tr:'Orta-üst · AM5 · 3D V-Cache' },
  r7_7700:   { tier:'upper-mid', desc_en:'Upper-mid · AM5 · DDR5',       desc_tr:'Orta-üst · AM5 · DDR5' },
  r7_7700x:  { tier:'upper-mid', desc_en:'Upper-mid · AM5 · DDR5',       desc_tr:'Orta-üst · AM5 · DDR5' },
  r7_7800x3d:{ tier:'flagship',  desc_en:'Flagship gaming · AM5 · 3D V-Cache', desc_tr:'Amiral gemisi · AM5 · 3D V-Cache' },
  r9_7900x:  { tier:'high-end',  desc_en:'High-end · AM5 · DDR5',        desc_tr:'Üst seviye · AM5 · DDR5' },
  r9_7950x:  { tier:'high-end',  desc_en:'High-end · AM5 · DDR5',        desc_tr:'Üst seviye · AM5 · DDR5' },
  r9_7950x3d:{ tier:'flagship',  desc_en:'Flagship · AM5 · 3D V-Cache',  desc_tr:'Amiral gemisi · AM5 · 3D V-Cache' },
  r5_9600x:  { tier:'upper-mid', desc_en:'Upper-mid · AM5 · DDR5',       desc_tr:'Orta-üst · AM5 · DDR5' },
  r7_9700x:  { tier:'high-end',  desc_en:'High-end · AM5 · DDR5',        desc_tr:'Üst seviye · AM5 · DDR5' },
  r7_9800x3d:{ tier:'flagship',  desc_en:'Flagship gaming · AM5 · 3D V-Cache', desc_tr:'Amiral gemisi · AM5 · 3D V-Cache' },
  r9_9900x:  { tier:'high-end',  desc_en:'High-end · AM5 · DDR5',        desc_tr:'Üst seviye · AM5 · DDR5' },
  r9_9950x:  { tier:'flagship',  desc_en:'Flagship · AM5 · DDR5',        desc_tr:'Amiral gemisi · AM5 · DDR5' },
  r9_9900x3d:{ tier:'flagship',  desc_en:'Flagship · AM5 · 3D V-Cache',  desc_tr:'Amiral gemisi · AM5 · 3D V-Cache' },
  r9_9950x3d:{ tier:'flagship',  desc_en:'Flagship · AM5 · 3D V-Cache',  desc_tr:'Amiral gemisi · AM5 · 3D V-Cache' },
  // Intel 6-9th Gen
  i5_6500:   { tier:'entry',     desc_en:'Older entry · LGA1151 · DDR4', desc_tr:'Eski giriş · LGA1151 · DDR4' },
  i5_6600k:  { tier:'entry',     desc_en:'Older entry · LGA1151 · DDR4', desc_tr:'Eski giriş · LGA1151 · DDR4' },
  i7_6700:   { tier:'entry',     desc_en:'Older mid · LGA1151 · DDR4',   desc_tr:'Eski orta · LGA1151 · DDR4' },
  i7_6700k:  { tier:'entry',     desc_en:'Older mid · LGA1151 · DDR4',   desc_tr:'Eski orta · LGA1151 · DDR4' },
  i5_7400:   { tier:'entry',     desc_en:'Older entry · LGA1151 · DDR4', desc_tr:'Eski giriş · LGA1151 · DDR4' },
  i5_7600k:  { tier:'entry',     desc_en:'Older entry · LGA1151 · DDR4', desc_tr:'Eski giriş · LGA1151 · DDR4' },
  i7_7700:   { tier:'entry',     desc_en:'Older mid · LGA1151 · DDR4',   desc_tr:'Eski orta · LGA1151 · DDR4' },
  i7_7700k:  { tier:'mid',       desc_en:'Older mid · LGA1151 · DDR4',   desc_tr:'Eski orta · LGA1151 · DDR4' },
  i5_8400:   { tier:'entry',     desc_en:'Entry · LGA1151 · DDR4',       desc_tr:'Giriş · LGA1151 · DDR4' },
  i5_8600k:  { tier:'mid',       desc_en:'Mid · LGA1151 · DDR4',         desc_tr:'Orta · LGA1151 · DDR4' },
  i7_8700:   { tier:'mid',       desc_en:'Mid · LGA1151 · DDR4',         desc_tr:'Orta · LGA1151 · DDR4' },
  i7_8700k:  { tier:'mid',       desc_en:'Mid · LGA1151 · DDR4',         desc_tr:'Orta · LGA1151 · DDR4' },
  i5_9400f:  { tier:'entry',     desc_en:'Entry · LGA1151 · DDR4',       desc_tr:'Giriş · LGA1151 · DDR4' },
  i5_9600k:  { tier:'mid',       desc_en:'Mid · LGA1151 · DDR4',         desc_tr:'Orta · LGA1151 · DDR4' },
  i7_9700k:  { tier:'mid',       desc_en:'Upper-mid · LGA1151 · DDR4',   desc_tr:'Orta-üst · LGA1151 · DDR4' },
  i9_9900k:  { tier:'upper-mid', desc_en:'Upper-mid · LGA1151 · DDR4',   desc_tr:'Orta-üst · LGA1151 · DDR4' },
  // Intel 10-14th Gen
  i5_10400:  { tier:'mid',       desc_en:'Mid · LGA1200 · DDR4',         desc_tr:'Orta · LGA1200 · DDR4' },
  i5_10400f: { tier:'mid',       desc_en:'Mid · LGA1200 · DDR4',         desc_tr:'Orta · LGA1200 · DDR4' },
  i5_10600k: { tier:'mid',       desc_en:'Mid · LGA1200 · DDR4',         desc_tr:'Orta · LGA1200 · DDR4' },
  i5_11400:  { tier:'mid',       desc_en:'Mid · LGA1200 · DDR4',         desc_tr:'Orta · LGA1200 · DDR4' },
  i5_11400f: { tier:'mid',       desc_en:'Mid · LGA1200 · DDR4',         desc_tr:'Orta · LGA1200 · DDR4' },
  i5_11600k: { tier:'mid',       desc_en:'Mid · LGA1200 · DDR4',         desc_tr:'Orta · LGA1200 · DDR4' },
  i3_12100f: { tier:'entry',     desc_en:'Entry · LGA1700 · DDR4/5',     desc_tr:'Giriş · LGA1700 · DDR4/5' },
  i5_12400:  { tier:'mid',       desc_en:'Mid · LGA1700 · DDR4/5',       desc_tr:'Orta · LGA1700 · DDR4/5' },
  i5_12400f: { tier:'mid',       desc_en:'Mid · LGA1700 · DDR4/5',       desc_tr:'Orta · LGA1700 · DDR4/5' },
  i5_12600k: { tier:'upper-mid', desc_en:'Upper-mid · LGA1700 · DDR4/5', desc_tr:'Orta-üst · LGA1700 · DDR4/5' },
  i5_13400:  { tier:'mid',       desc_en:'Mid · LGA1700 · DDR4/5',       desc_tr:'Orta · LGA1700 · DDR4/5' },
  i5_13400f: { tier:'mid',       desc_en:'Mid · LGA1700 · DDR4/5',       desc_tr:'Orta · LGA1700 · DDR4/5' },
  i5_13500:  { tier:'mid',       desc_en:'Mid · LGA1700 · DDR4/5',       desc_tr:'Orta · LGA1700 · DDR4/5' },
  i5_13600k: { tier:'upper-mid', desc_en:'Upper-mid · LGA1700 · DDR4/5', desc_tr:'Orta-üst · LGA1700 · DDR4/5' },
  i5_13600kf:{ tier:'upper-mid', desc_en:'Upper-mid · LGA1700 · DDR4/5', desc_tr:'Orta-üst · LGA1700 · DDR4/5' },
  i5_14400f: { tier:'mid',       desc_en:'Mid · LGA1700 · DDR4/5',       desc_tr:'Orta · LGA1700 · DDR4/5' },
  i5_14600k: { tier:'upper-mid', desc_en:'Upper-mid · LGA1700 · DDR4/5', desc_tr:'Orta-üst · LGA1700 · DDR4/5' },
  i7_10700:  { tier:'upper-mid', desc_en:'Upper-mid · LGA1200 · DDR4',   desc_tr:'Orta-üst · LGA1200 · DDR4' },
  i7_10700k: { tier:'upper-mid', desc_en:'Upper-mid · LGA1200 · DDR4',   desc_tr:'Orta-üst · LGA1200 · DDR4' },
  i7_11700k: { tier:'upper-mid', desc_en:'Upper-mid · LGA1200 · DDR4',   desc_tr:'Orta-üst · LGA1200 · DDR4' },
  i7_12700k: { tier:'high-end',  desc_en:'High-end · LGA1700 · DDR4/5',  desc_tr:'Üst seviye · LGA1700 · DDR4/5' },
  i7_13700k: { tier:'high-end',  desc_en:'High-end · LGA1700 · DDR4/5',  desc_tr:'Üst seviye · LGA1700 · DDR4/5' },
  i7_14700k: { tier:'high-end',  desc_en:'High-end · LGA1700 · DDR4/5',  desc_tr:'Üst seviye · LGA1700 · DDR4/5' },
  i9_10900k: { tier:'upper-mid', desc_en:'Upper-mid · LGA1200 · DDR4',   desc_tr:'Orta-üst · LGA1200 · DDR4' },
  i9_12900k: { tier:'high-end',  desc_en:'High-end · LGA1700 · DDR4/5',  desc_tr:'Üst seviye · LGA1700 · DDR4/5' },
  i9_13900k: { tier:'flagship',  desc_en:'Flagship · LGA1700 · DDR4/5',  desc_tr:'Amiral gemisi · LGA1700 · DDR4/5' },
  i9_14900k: { tier:'flagship',  desc_en:'Flagship · LGA1700 · DDR4/5',  desc_tr:'Amiral gemisi · LGA1700 · DDR4/5' },
  i9_14900ks:{ tier:'flagship',  desc_en:'Flagship · LGA1700 · DDR4/5',  desc_tr:'Amiral gemisi · LGA1700 · DDR4/5' },
  // Intel Core Ultra 200S
  ultra5_245k:{ tier:'upper-mid', desc_en:'Upper-mid · LGA1851 · DDR5',  desc_tr:'Orta-üst · LGA1851 · DDR5' },
  ultra7_265k:{ tier:'high-end',  desc_en:'High-end · LGA1851 · DDR5',   desc_tr:'Üst seviye · LGA1851 · DDR5' },
  ultra9_285k:{ tier:'flagship',  desc_en:'Flagship · LGA1851 · DDR5',   desc_tr:'Amiral gemisi · LGA1851 · DDR5' },
  // Laptop CPUs
  i5_10300h: { tier:'entry',     desc_en:'Entry laptop · H-series',      desc_tr:'Giriş laptop · H serisi' },
  i5_11400h: { tier:'entry',     desc_en:'Entry laptop · H-series',      desc_tr:'Giriş laptop · H serisi' },
  i5_12500h: { tier:'mid',       desc_en:'Mid laptop · H-series',        desc_tr:'Orta laptop · H serisi' },
  i5_13500h: { tier:'mid',       desc_en:'Mid laptop · H-series',        desc_tr:'Orta laptop · H serisi' },
  i7_10750h: { tier:'mid',       desc_en:'Mid laptop · H-series',        desc_tr:'Orta laptop · H serisi' },
  i7_11800h: { tier:'mid',       desc_en:'Mid laptop · H-series',        desc_tr:'Orta laptop · H serisi' },
  i7_12700h: { tier:'upper-mid', desc_en:'Upper-mid laptop · H-series',  desc_tr:'Orta-üst laptop · H serisi' },
  i7_13700h: { tier:'upper-mid', desc_en:'Upper-mid laptop · H-series',  desc_tr:'Orta-üst laptop · H serisi' },
  r5_4600h:  { tier:'entry',     desc_en:'Entry laptop · Ryzen H',       desc_tr:'Giriş laptop · Ryzen H' },
  r5_5600h:  { tier:'mid',       desc_en:'Mid laptop · Ryzen H',         desc_tr:'Orta laptop · Ryzen H' },
  r7_5800h:  { tier:'upper-mid', desc_en:'Upper-mid laptop · Ryzen H',   desc_tr:'Orta-üst laptop · Ryzen H' },
  r7_6800h:  { tier:'upper-mid', desc_en:'Upper-mid laptop · Ryzen H',   desc_tr:'Orta-üst laptop · Ryzen H' },
  r7_7735hs: { tier:'upper-mid', desc_en:'Upper-mid laptop · Ryzen HS',  desc_tr:'Orta-üst laptop · Ryzen HS' },
  r7_7840hs: { tier:'high-end',  desc_en:'High-end laptop · Ryzen HS',   desc_tr:'Üst seviye laptop · Ryzen HS' },
  r9_7940hs: { tier:'high-end',  desc_en:'High-end laptop · Ryzen HS',   desc_tr:'Üst seviye laptop · Ryzen HS' },
};

export const GPU_TIER = {
  // GTX 900/10
  gtx970:     { tier:'entry',     desc_en:'Entry · 1080p low/med',         desc_tr:'Giriş · 1080p düşük/orta' },
  gtx980ti:   { tier:'entry',     desc_en:'Entry · 1080p med',             desc_tr:'Giriş · 1080p orta' },
  gtx1050ti:  { tier:'entry',     desc_en:'Entry · 1080p low',             desc_tr:'Giriş · 1080p düşük' },
  gtx1060_3gb:{ tier:'entry',     desc_en:'Entry · 1080p med',             desc_tr:'Giriş · 1080p orta' },
  gtx1060_6gb:{ tier:'entry',     desc_en:'Entry · 1080p med/high',        desc_tr:'Giriş · 1080p orta/yüksek' },
  gtx1070:    { tier:'mid',       desc_en:'Mid · 1080p high',              desc_tr:'Orta · 1080p yüksek' },
  gtx1070ti:  { tier:'mid',       desc_en:'Mid · 1080p high / 1440p low',  desc_tr:'Orta · 1080p yüksek / 1440p düşük' },
  gtx1080:    { tier:'mid',       desc_en:'Mid · 1440p med',               desc_tr:'Orta · 1440p orta' },
  gtx1080ti:  { tier:'upper-mid', desc_en:'Upper-mid · 1440p high',        desc_tr:'Orta-üst · 1440p yüksek' },
  gtx1650:    { tier:'entry',     desc_en:'Entry · 1080p med',             desc_tr:'Giriş · 1080p orta' },
  gtx1650s:   { tier:'entry',     desc_en:'Entry · 1080p med/high',        desc_tr:'Giriş · 1080p orta/yüksek' },
  gtx1660:    { tier:'mid',       desc_en:'Mid · 1080p high',              desc_tr:'Orta · 1080p yüksek' },
  gtx1660s:   { tier:'mid',       desc_en:'Mid · 1080p high',              desc_tr:'Orta · 1080p yüksek' },
  gtx1660ti:  { tier:'mid',       desc_en:'Mid · 1080p high',              desc_tr:'Orta · 1080p yüksek' },
  // RTX 20
  rtx2060:    { tier:'mid',       desc_en:'Mid · 1080p ultra / 1440p med', desc_tr:'Orta · 1080p ultra / 1440p orta' },
  rtx2060s:   { tier:'upper-mid', desc_en:'Upper-mid · 1440p med/high',    desc_tr:'Orta-üst · 1440p orta/yüksek' },
  rtx2070:    { tier:'upper-mid', desc_en:'Upper-mid · 1440p high',        desc_tr:'Orta-üst · 1440p yüksek' },
  rtx2070s:   { tier:'upper-mid', desc_en:'Upper-mid · 1440p high',        desc_tr:'Orta-üst · 1440p yüksek' },
  rtx2080:    { tier:'high-end',  desc_en:'High-end · 1440p ultra / 4K',   desc_tr:'Üst seviye · 1440p ultra / 4K' },
  rtx2080ti:  { tier:'high-end',  desc_en:'High-end · 1440p ultra / 4K',   desc_tr:'Üst seviye · 1440p ultra / 4K' },
  // RTX 30
  rtx3050:    { tier:'entry',     desc_en:'Entry · 1080p high · DLSS2',    desc_tr:'Giriş · 1080p yüksek · DLSS2' },
  rtx3060:    { tier:'mid',       desc_en:'Mid · 1080p ultra / 1440p med · DLSS2', desc_tr:'Orta · 1080p ultra / 1440p orta · DLSS2' },
  rtx3060ti:  { tier:'upper-mid', desc_en:'Upper-mid · 1440p high · DLSS2',desc_tr:'Orta-üst · 1440p yüksek · DLSS2' },
  rtx3070:    { tier:'upper-mid', desc_en:'Upper-mid · 1440p ultra · DLSS2',desc_tr:'Orta-üst · 1440p ultra · DLSS2' },
  rtx3070ti:  { tier:'upper-mid', desc_en:'Upper-mid · 1440p ultra · DLSS2',desc_tr:'Orta-üst · 1440p ultra · DLSS2' },
  rtx3080:    { tier:'high-end',  desc_en:'High-end · 4K med/high · DLSS2',desc_tr:'Üst seviye · 4K orta/yüksek · DLSS2' },
  rtx3080ti:  { tier:'high-end',  desc_en:'High-end · 4K high · DLSS2',    desc_tr:'Üst seviye · 4K yüksek · DLSS2' },
  rtx3090:    { tier:'flagship',  desc_en:'Flagship · 4K ultra · DLSS2',   desc_tr:'Amiral gemisi · 4K ultra · DLSS2' },
  // RTX 40
  rtx4060:    { tier:'mid',       desc_en:'Mid · 1080p ultra · DLSS3/AV1', desc_tr:'Orta · 1080p ultra · DLSS3/AV1' },
  rtx4060ti:  { tier:'upper-mid', desc_en:'Upper-mid · 1440p high · DLSS3',desc_tr:'Orta-üst · 1440p yüksek · DLSS3' },
  rtx4070:    { tier:'high-end',  desc_en:'High-end · 1440p ultra · DLSS3',desc_tr:'Üst seviye · 1440p ultra · DLSS3' },
  rtx4070s:   { tier:'high-end',  desc_en:'High-end · 1440p/4K · DLSS3',   desc_tr:'Üst seviye · 1440p/4K · DLSS3' },
  rtx4070ti:  { tier:'high-end',  desc_en:'High-end · 4K med/high · DLSS3',desc_tr:'Üst seviye · 4K orta/yüksek · DLSS3' },
  rtx4070tis: { tier:'high-end',  desc_en:'High-end · 4K high · DLSS3',    desc_tr:'Üst seviye · 4K yüksek · DLSS3' },
  rtx4080:    { tier:'flagship',  desc_en:'Flagship · 4K ultra · DLSS3',   desc_tr:'Amiral gemisi · 4K ultra · DLSS3' },
  rtx4080s:   { tier:'flagship',  desc_en:'Flagship · 4K ultra · DLSS3',   desc_tr:'Amiral gemisi · 4K ultra · DLSS3' },
  rtx4090:    { tier:'flagship',  desc_en:'Best-in-class · 4K · DLSS3',    desc_tr:'Sınıfının en iyisi · 4K · DLSS3' },
  // RTX 50
  rtx5050:    { tier:'entry',     desc_en:'Entry · 1080p · DLSS4/AV1',     desc_tr:'Giriş · 1080p · DLSS4/AV1' },
  rtx5060:    { tier:'mid',       desc_en:'Mid · 1080p ultra · DLSS4',     desc_tr:'Orta · 1080p ultra · DLSS4' },
  rtx5060ti:  { tier:'upper-mid', desc_en:'Upper-mid · 1440p · DLSS4',     desc_tr:'Orta-üst · 1440p · DLSS4' },
  rtx5070:    { tier:'high-end',  desc_en:'High-end · 1440p/4K · DLSS4',   desc_tr:'Üst seviye · 1440p/4K · DLSS4' },
  rtx5070ti:  { tier:'high-end',  desc_en:'High-end · 4K · DLSS4',         desc_tr:'Üst seviye · 4K · DLSS4' },
  rtx5080:    { tier:'flagship',  desc_en:'Flagship · 4K ultra · DLSS4',   desc_tr:'Amiral gemisi · 4K ultra · DLSS4' },
  rtx5090:    { tier:'flagship',  desc_en:'Best-in-class · 4K · DLSS4',    desc_tr:'Sınıfının en iyisi · 4K · DLSS4' },
  // AMD RX 500 / 5000 / 6000
  rx570:      { tier:'entry',     desc_en:'Entry · 1080p med',             desc_tr:'Giriş · 1080p orta' },
  rx580:      { tier:'entry',     desc_en:'Entry · 1080p high',            desc_tr:'Giriş · 1080p yüksek' },
  rx590:      { tier:'entry',     desc_en:'Entry · 1080p high',            desc_tr:'Giriş · 1080p yüksek' },
  rx5500xt:   { tier:'entry',     desc_en:'Entry · 1080p high',            desc_tr:'Giriş · 1080p yüksek' },
  rx5600xt:   { tier:'mid',       desc_en:'Mid · 1080p ultra',             desc_tr:'Orta · 1080p ultra' },
  rx5700:     { tier:'mid',       desc_en:'Mid · 1080p ultra / 1440p',     desc_tr:'Orta · 1080p ultra / 1440p' },
  rx5700xt:   { tier:'mid',       desc_en:'Mid · 1440p med',               desc_tr:'Orta · 1440p orta' },
  rx6400:     { tier:'entry',     desc_en:'Entry · 1080p med · No AV1',    desc_tr:'Giriş · 1080p orta · AV1 yok' },
  rx6500xt:   { tier:'entry',     desc_en:'Entry · 1080p med',             desc_tr:'Giriş · 1080p orta' },
  rx6600:     { tier:'mid',       desc_en:'Mid · 1080p ultra',             desc_tr:'Orta · 1080p ultra' },
  rx6650xt:   { tier:'upper-mid', desc_en:'Upper-mid · 1080p ultra',       desc_tr:'Orta-üst · 1080p ultra' },
  rx6700xt:   { tier:'upper-mid', desc_en:'Upper-mid · 1440p high',        desc_tr:'Orta-üst · 1440p yüksek' },
  rx6750xt:   { tier:'upper-mid', desc_en:'Upper-mid · 1440p high',        desc_tr:'Orta-üst · 1440p yüksek' },
  rx6800:     { tier:'high-end',  desc_en:'High-end · 1440p ultra',        desc_tr:'Üst seviye · 1440p ultra' },
  rx6800xt:   { tier:'high-end',  desc_en:'High-end · 4K med/high',        desc_tr:'Üst seviye · 4K orta/yüksek' },
  rx6900xt:   { tier:'high-end',  desc_en:'High-end · 4K high',            desc_tr:'Üst seviye · 4K yüksek' },
  rx6950xt:   { tier:'flagship',  desc_en:'Flagship · 4K ultra',           desc_tr:'Amiral gemisi · 4K ultra' },
  // AMD RX 7000 / 9000
  rx7600:     { tier:'mid',       desc_en:'Mid · 1080p ultra · AV1',       desc_tr:'Orta · 1080p ultra · AV1' },
  rx7600xt:   { tier:'mid',       desc_en:'Mid · 1080p ultra / 1440p',     desc_tr:'Orta · 1080p ultra / 1440p' },
  rx7700xt:   { tier:'upper-mid', desc_en:'Upper-mid · 1440p high · AV1',  desc_tr:'Orta-üst · 1440p yüksek · AV1' },
  rx7800xt:   { tier:'upper-mid', desc_en:'Upper-mid · 1440p ultra · AV1', desc_tr:'Orta-üst · 1440p ultra · AV1' },
  rx7900gre:  { tier:'high-end',  desc_en:'High-end · 4K med · AV1',       desc_tr:'Üst seviye · 4K orta · AV1' },
  rx7900xt:   { tier:'high-end',  desc_en:'High-end · 4K high · AV1',      desc_tr:'Üst seviye · 4K yüksek · AV1' },
  rx7900xtx:  { tier:'flagship',  desc_en:'Flagship · 4K ultra · AV1',     desc_tr:'Amiral gemisi · 4K ultra · AV1' },
  rx9060xt:   { tier:'upper-mid', desc_en:'Upper-mid · 1440p · AV1',       desc_tr:'Orta-üst · 1440p · AV1' },
  rx9070gre:  { tier:'high-end',  desc_en:'High-end · 4K med · AV1',       desc_tr:'Üst seviye · 4K orta · AV1' },
  rx9070:     { tier:'high-end',  desc_en:'High-end · 4K high · AV1',      desc_tr:'Üst seviye · 4K yüksek · AV1' },
  rx9070xt:   { tier:'high-end',  desc_en:'High-end · 4K ultra · AV1',     desc_tr:'Üst seviye · 4K ultra · AV1' },
  // Intel Arc
  arc_a380:   { tier:'entry',     desc_en:'Entry · 1080p med · AV1',       desc_tr:'Giriş · 1080p orta · AV1' },
  arc_a580:   { tier:'mid',       desc_en:'Mid · 1080p high · AV1',        desc_tr:'Orta · 1080p yüksek · AV1' },
  arc_a750:   { tier:'mid',       desc_en:'Mid · 1080p ultra · AV1',       desc_tr:'Orta · 1080p ultra · AV1' },
  arc_a770:   { tier:'mid',       desc_en:'Mid · 1080p ultra / 1440p',     desc_tr:'Orta · 1080p ultra / 1440p' },
  arc_b570:   { tier:'mid',       desc_en:'Mid · 1080p ultra · AV1',       desc_tr:'Orta · 1080p ultra · AV1' },
  arc_b580:   { tier:'upper-mid', desc_en:'Upper-mid · 1440p · AV1',       desc_tr:'Orta-üst · 1440p · AV1' },
  // Laptop GPUs
  gtx1650_laptop:    { tier:'entry',     desc_en:'Entry laptop',           desc_tr:'Giriş laptop' },
  gtx1660ti_laptop:  { tier:'mid',       desc_en:'Mid laptop',             desc_tr:'Orta laptop' },
  rtx3050_laptop:    { tier:'entry',     desc_en:'Entry laptop · DLSS2',   desc_tr:'Giriş laptop · DLSS2' },
  rtx3060_laptop:    { tier:'mid',       desc_en:'Mid laptop · DLSS2',     desc_tr:'Orta laptop · DLSS2' },
  rtx3070_laptop:    { tier:'upper-mid', desc_en:'Upper-mid laptop · DLSS2',desc_tr:'Orta-üst laptop · DLSS2' },
  rtx4050_laptop:    { tier:'mid',       desc_en:'Mid laptop · DLSS3',     desc_tr:'Orta laptop · DLSS3' },
  rtx4060_laptop:    { tier:'upper-mid', desc_en:'Upper-mid laptop · DLSS3',desc_tr:'Orta-üst laptop · DLSS3' },
  rtx4070_laptop:    { tier:'high-end',  desc_en:'High-end laptop · DLSS3',desc_tr:'Üst seviye laptop · DLSS3' },
  rtx4080_laptop:    { tier:'flagship',  desc_en:'Flagship laptop · DLSS3',desc_tr:'Amiral gemisi laptop · DLSS3' },
  rx5600m:    { tier:'mid',       desc_en:'Mid laptop',                    desc_tr:'Orta laptop' },
  rx6600m:    { tier:'mid',       desc_en:'Mid laptop · AV1',              desc_tr:'Orta laptop · AV1' },
  rx6800m:    { tier:'upper-mid', desc_en:'Upper-mid laptop · AV1',        desc_tr:'Orta-üst laptop · AV1' },
  rx7600s:    { tier:'mid',       desc_en:'Mid laptop · AV1',              desc_tr:'Orta laptop · AV1' },
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
