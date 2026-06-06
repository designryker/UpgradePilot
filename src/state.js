// ── Shared application state ──────────────────────────────────────────
// All modules import from here. Nothing else should hold mutable globals.

export let currentLang = 'en';
export let hasTouchedSpecs = false;
export let latestResultSummary = '';
export let analysisSequenceTimer = null;
export let analysisMessageTimer = null;

export function setCurrentLang(v)            { currentLang = v; }
export function setHasTouchedSpecs(v)        { hasTouchedSpecs = v; }
export function setLatestResultSummary(v)    { latestResultSummary = v; }
export function setAnalysisSequenceTimer(v)  { analysisSequenceTimer = v; }
export function setAnalysisMessageTimer(v)   { analysisMessageTimer = v; }

export const QUICK_PARTS = {
  desktop: {
    cpu: [
      ['r5_2600', 'Ryzen 5 2600'],
      ['r5_3600', 'Ryzen 5 3600'],
      ['r5_5600', 'Ryzen 5 5600'],
      ['i5_9400f', 'i5-9400F'],
      ['i7_7700k', 'i7-7700K'],
      ['i5_10400f', 'i5-10400F'],
    ],
    gpu: [
      ['gtx1050ti', 'GTX 1050 Ti'],
      ['gtx1060_6gb', 'GTX 1060'],
      ['gtx1650', 'GTX 1650'],
      ['gtx1660s', 'GTX 1660S'],
      ['rx580', 'RX 580'],
      ['rtx2060', 'RTX 2060'],
    ],
  },
  laptop: {
    cpu: [
      ['i5_10300h', 'i5-10300H'],
      ['i5_11400h', 'i5-11400H'],
      ['i7_10750h', 'i7-10750H'],
      ['i7_12700h', 'i7-12700H'],
      ['r5_5600h', 'Ryzen 5 5600H'],
      ['r7_5800h', 'Ryzen 7 5800H'],
    ],
    gpu: [
      ['gtx1650_laptop', 'GTX 1650 Laptop'],
      ['rtx3050_laptop', 'RTX 3050 Laptop'],
      ['rtx3060_laptop', 'RTX 3060 Laptop'],
      ['rtx4050_laptop', 'RTX 4050 Laptop'],
      ['rtx4060_laptop', 'RTX 4060 Laptop'],
      ['rtx4070_laptop', 'RTX 4070 Laptop'],
    ],
  },
};
