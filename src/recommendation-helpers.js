export function normalizePartSearch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export const ANALYSIS_SEQUENCE_MS = 2400;

const ANALYSIS_MESSAGES = {
  en: [
    'Analyzing your system...',
    'Checking CPU and GPU balance...',
    'Looking for performance bottlenecks...',
    'Searching for free optimizations...',
    'Estimating upgrade value...',
    'Building your upgrade decision...',
  ],
  tr: [
    'Sisteminiz analiz ediliyor...',
    'CPU ve GPU dengesi kontrol ediliyor...',
    'Performans darboğazları aranıyor...',
    'Ücretsiz optimizasyonlar inceleniyor...',
    'Yükseltme değeri hesaplanıyor...',
    'Yükseltme kararınız hazırlanıyor...',
  ],
};

export function getAnalysisMessages(lang) {
  return ANALYSIS_MESSAGES[lang === 'tr' ? 'tr' : 'en'];
}

const GPU_ALIASES = {
  gtx970: ['970', 'geforce gtx 970'],
  gtx980ti: ['980ti', '980 ti', 'geforce gtx 980 ti'],
  gtx1050ti: ['1050ti', '1050 ti', 'geforce gtx 1050 ti'],
  gtx1060_3gb: ['1060', '1060 3gb', 'gtx 1060 3g'],
  gtx1060_6gb: ['1060', '1060 6gb', 'gtx 1060 6g'],
  gtx1070: ['1070', 'geforce gtx 1070'],
  gtx1070ti: ['1070ti', '1070 ti', 'geforce gtx 1070 ti'],
  gtx1080: ['1080', 'geforce gtx 1080'],
  gtx1080ti: ['1080ti', '1080 ti', 'geforce gtx 1080 ti'],
  gtx1650s: ['1650s', '1650 super'],
  gtx1660s: ['1660s', '1660 super'],
  gtx1660ti: ['1660ti', '1660 ti'],
  rtx2060s: ['2060s', '2060 super'],
  rtx2070s: ['2070s', '2070 super'],
  rtx4070s: ['4070s', '4070 super'],
  rtx4070tis: ['4070tis', '4070 ti super'],
  rtx4080s: ['4080s', '4080 super'],
  rx580: ['580', 'radeon rx 580'],
  rx570: ['570', 'radeon rx 570'],
  rx5600xt: ['5600xt', '5600 xt'],
  rx5700xt: ['5700xt', '5700 xt'],
  rx6700xt: ['6700xt', '6700 xt'],
  rx7800xt: ['7800xt', '7800 xt'],
  rx7900gre: ['7900gre', '7900 gre'],
  rx7900xt: ['7900xt', '7900 xt'],
  rx7900xtx: ['7900xtx', '7900 xtx'],
};

const CPU_ALIASES = {
  i7_10700: ['10700', 'i7 10700', 'core i7 10700'],
  i7_10700k: ['10700k', 'i7 10700k', 'core i7 10700k'],
  i5_10400f: ['10400f', 'i5 10400f', 'core i5 10400f'],
  i5_9400f: ['9400f', 'i5 9400f', 'core i5 9400f'],
  i7_7700k: ['7700k', 'i7 7700k', 'core i7 7700k'],
  r5_2600: ['2600', 'ryzen 2600'],
  r5_3600: ['3600', 'ryzen 3600'],
  r5_5600: ['5600', 'ryzen 5600'],
  r5_5600x: ['5600x', 'ryzen 5600x'],
  r7_5700x3d: ['5700x3d', 'ryzen 5700x3d'],
  r7_5800x3d: ['5800x3d', 'ryzen 5800x3d'],
};

export function buildPartSearchText(selectId, value, label) {
  const aliases = selectId === 'gpu' ? GPU_ALIASES[value] : CPU_ALIASES[value];
  return [
    label,
    value,
    String(value || '').replace(/_/g, ''),
    ...(aliases || []),
  ].map(normalizePartSearch).join(' ');
}

export function getBiosRecommendation({
  bestKey,
  ramSpeedTier,
  isSingleChannel,
  oldIntelPlatform,
  oldAm4Platform,
  isModernIntelHybrid,
  unknownCooler,
  weakCooler,
}) {
  if ((bestKey === 'ramspd' || ramSpeedTier === 0) && !isSingleChannel) {
    return {
      kind: 'memory',
      group: 'BIOS / Memory',
      text: 'Check XMP/EXPO in BIOS, then confirm the actual RAM speed in CPU-Z.',
    };
  }

  if (oldAm4Platform && (bestKey === 'cpu' || bestKey === 'ramspd')) {
    return {
      kind: 'platform',
      group: 'BIOS / Platform',
      text: 'Before an AM4 CPU upgrade, confirm motherboard BIOS support for the target CPU.',
    };
  }

  if (isModernIntelHybrid) {
    return {
      kind: 'platform',
      group: 'BIOS / Platform',
      text: 'For hybrid Intel CPUs, keep BIOS and chipset drivers current before judging CPU scheduling.',
    };
  }

  if ((unknownCooler || weakCooler) && bestKey === 'cpu') {
    return {
      kind: 'stability',
      group: 'BIOS / Stability',
      text: 'If temperatures and boost clocks look wrong, check BIOS defaults before replacing the CPU.',
    };
  }

  if (oldIntelPlatform && bestKey === 'cpu') {
    return {
      kind: 'platform',
      group: 'BIOS / Platform',
      text: 'Older Intel platforms rarely have a clean CPU drop-in path; verify board support before buying.',
    };
  }

  return null;
}
