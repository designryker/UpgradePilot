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
  gtx1650_laptop: ['gtx 1650 laptop', '1650 mobile'],
  gtx1660ti_laptop: ['gtx 1660 ti laptop', '1660ti mobile', '1660 ti mobile'],
  rtx3050_laptop: ['rtx 3050 laptop', '3050 mobile'],
  rtx3060_laptop: ['rtx 3060 laptop', '3060 mobile'],
  rtx3070_laptop: ['rtx 3070 laptop', '3070 mobile'],
  rtx4050_laptop: ['rtx 4050 laptop', '4050 mobile'],
  rtx4060_laptop: ['rtx 4060 laptop', '4060 mobile'],
  rtx4070_laptop: ['rtx 4070 laptop', '4070 mobile'],
  rtx4080_laptop: ['rtx 4080 laptop', '4080 mobile'],
  rx5600m: ['rx 5600m', 'radeon rx 5600m'],
  rx6600m: ['rx 6600m', 'radeon rx 6600m'],
  rx6800m: ['rx 6800m', 'radeon rx 6800m'],
  rx7600s: ['rx 7600s', 'radeon rx 7600s'],
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
  i5_10300h: ['10300h', 'i5 10300h', 'core i5 10300h'],
  i5_11400h: ['11400h', 'i5 11400h', 'core i5 11400h'],
  i5_12500h: ['12500h', 'i5 12500h', 'core i5 12500h'],
  i5_13500h: ['13500h', 'i5 13500h', 'core i5 13500h'],
  i7_10750h: ['10750h', 'i7 10750h', 'core i7 10750h'],
  i7_11800h: ['11800h', 'i7 11800h', 'core i7 11800h'],
  i7_12700h: ['12700h', 'i7 12700h', 'core i7 12700h'],
  i7_13700h: ['13700h', 'i7 13700h', 'core i7 13700h'],
  r5_4600h: ['4600h', 'ryzen 4600h'],
  r5_5600h: ['5600h', 'ryzen 5600h'],
  r7_5800h: ['5800h', 'ryzen 5800h'],
  r7_6800h: ['6800h', 'ryzen 6800h'],
  r7_7735hs: ['7735hs', 'ryzen 7735hs'],
  r7_7840hs: ['7840hs', 'ryzen 7840hs'],
  r9_7940hs: ['7940hs', 'ryzen 7940hs'],
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
