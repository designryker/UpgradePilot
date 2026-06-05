// ── Simple EN/TR language layer for MVP testing ──
let currentLang = 'en';
const I18N = {
  en: {
    title:'RigPilot — PC Performance & Upgrade Advisor',
    languageLabel:'Language',
    eyebrow:'// v0.3.2 — PC Performance & Upgrade Advisor',
    tagline:'Optimize first. Upgrade smart.',
    subtitle:'Fill in your current specs. RigPilot will tell you what is likely limiting you, what free fixes to try first, and <strong>only then</strong> whether a hardware upgrade is actually worth the money.',
    secUserMode:'User Mode', userMode:'Experience Level', modeGuided:'Guided: show only important choices', modeGamer:'Gamer: show gaming-focused details', modeExpert:'Expert: show everything',
    userModeHint:'The form adapts and hides low-impact technical choices when you do not need them.',
    secCpuGpu:'CPU & GPU', currentCpu:'Current CPU', currentGpu:'Current GPU',
    cpuSearchPlaceholder:'Search CPU, e.g. 5600X', gpuSearchPlaceholder:'Search GPU, e.g. RTX 3060',
    secMemory:'Memory', ramCapacity:'RAM Capacity', memoryType:'Memory Type', memorySpeed:'Memory Speed', channelMode:'Memory Channel Mode',
    dualChannel:'Dual Channel', singleChannel:'Single Channel',
    secPower:'Power Supply', psuWattage:'PSU Wattage', psuPlaceholder:'e.g. 650', psuBarHint:'Pick the watt value written on your PSU label.', dontKnow:"I don't know",
    secSystemCooling:'System, Cooling & Storage', systemType:'System Type', desktopPc:'Desktop PC', gamingLaptop:'Gaming Laptop',
    cpuCooling:'CPU Cooling', stockCooler:'Stock / boxed cooler', basicAir:'Basic air cooler', towerAir:'Tower air cooler',
    aio120:'120mm liquid cooler', aio240:'240mm liquid cooler', aio360:'360mm liquid cooler',
    coolingHint:'Strong CPUs need enough cooling to hold boost clocks.', gameDrive:'System / Games Drive',
    windowsVersion:'Windows Version', otherOs:'Other / Linux',
    secDisplay:'Display & Gaming Profile', resolution:'Resolution', refreshRate:'Refresh Rate', gameFocus:'Primary Game Focus',
    detectDisplay:'Use Browser', aiSuggest:'AI Suggest',
    gameCompfps:'Competitive FPS (CS2, Valorant)', gameMmorpg:'MMORPG', gameAaa:'AAA / Open World', gameBattle:'Battle Royale (Warzone, Fortnite)',
    gameSim:'Simulation / Strategy', gameRacing:'Racing / Flight Sim', gameModded:'Modded Games', gameStream:'Streaming / Recording', gameMixed:'General Mixed Gaming',
    popularGame:'Popular Game', gameCustom:'Manual / mixed', popularGameHint:'Pick one to auto-tune game type and problem focus.',
    secondaryGoal:'Current Problem', goalNone:'No specific problem', goalFps:'I cannot hold 60 FPS at 4K/1440p', goalVisuals:'I want higher graphics without big FPS drops',
    goalSmooth:'Stutter / FPS drops / 1% lows', goalLatency:'Input delay feels high', goalStream:'Streaming or recording hurts performance',
    goalFuture:'I want the system to last longer', goalCheap:'Find the cheapest meaningful fix',
    secBudget:'Upgrade Budget', budgetAmount:'Budget Amount', budgetPlaceholder:'e.g. 500', currency:'Currency',
    currencyUsd:'USD (US Dollar)', currencyEur:'EUR (Euro)', currencyTry:'TRY (Turkish Lira)',
    analyzeBtn:'Find the Best Price/Performance Upgrade',
    loadingTitle:'Finding Best Value Parts', loadingCopy:'Checking the cheapest meaningful upgrades, free fixes, and parts that are not worth buying for this setup.',
    resultProduct:'RigPilot · Analysis',
    resPerformance:'Performance Diagnosis', resFreeFixes:'Free Performance Fixes', resValidate:'Before You Buy: Validate the Bottleneck',
    resBest:'Best Price/Performance Move', resPsu:'Recommended PSU for Next GPU Tier', resBudget:'Budget Match & Price Reality',
    resDnu:'I Do Not Recommend Upgrading', resFinal:'Final Decision',
  },
  tr: {
    title:'RigPilot — PC Performans ve Yükseltme Danışmanı',
    languageLabel:'Dil',
    eyebrow:'// v0.3.2 — PC Performans ve Yükseltme Danışmanı',
    tagline:'Önce optimize et. Sonra akıllıca yükselt.',
    subtitle:'Mevcut sistem bilgilerini gir. RigPilot sana sistemi neyin sınırladığını, önce hangi ücretsiz kontrolleri yapman gerektiğini ve gerçekten parça yükseltmeye değip değmediğini söyler.',
    secUserMode:'Kullanıcı Modu', userMode:'Deneyim Seviyesi', modeGuided:'Rehber: sadece önemli seçimler', modeGamer:'Oyuncu: oyun odaklı detaylar', modeExpert:'Uzman: her şeyi göster',
    userModeHint:'Form, ihtiyacın olmayan düşük etkili teknik seçimleri gizleyip sadeleşir.',
    secCpuGpu:'İşlemci ve Ekran Kartı', currentCpu:'Mevcut İşlemci', currentGpu:'Mevcut Ekran Kartı',
    cpuSearchPlaceholder:'İşlemci ara, örn. 5600X', gpuSearchPlaceholder:'Ekran kartı ara, örn. RTX 3060',
    secMemory:'Bellek', ramCapacity:'RAM Kapasitesi', memoryType:'Bellek Türü', memorySpeed:'Bellek Hızı', channelMode:'Bellek Kanal Modu',
    dualChannel:'Çift Kanal', singleChannel:'Tek Kanal',
    secPower:'Güç Kaynağı', psuWattage:'PSU Watt Değeri', psuPlaceholder:'örn. 650', psuBarHint:'PSU etiketinde yazan watt değerini seç.', dontKnow:'Bilmiyorum',
    secSystemCooling:'Sistem, Soğutma ve Depolama', systemType:'Sistem Tipi', desktopPc:'Masaüstü PC', gamingLaptop:'Gaming Laptop',
    cpuCooling:'İşlemci Soğutması', stockCooler:'Stok / kutudan çıkan soğutucu', basicAir:'Temel hava soğutma', towerAir:'Kule tipi hava soğutma',
    aio120:'120mm sıvı soğutma', aio240:'240mm sıvı soğutma', aio360:'360mm sıvı soğutma',
    coolingHint:'Güçlü işlemciler boost hızlarını korumak için yeterli soğutma ister.', gameDrive:'System / Games Diski',
    windowsVersion:'Windows Sürümü', otherOs:'Diğer / Linux',
    secDisplay:'Ekran ve Oyun Profili', resolution:'Çözünürlük', refreshRate:'Yenileme Hızı', gameFocus:'Ana Oyun Türü',
    detectDisplay:'Browserdan Al', aiSuggest:'Yapay Zeka Öner',
    gameCompfps:'Rekabetçi FPS (CS2, Valorant)', gameMmorpg:'MMORPG', gameAaa:'AAA / Açık Dünya', gameBattle:'Battle Royale (Warzone, Fortnite)',
    gameSim:'Simülasyon / Strateji', gameRacing:'Yarış / Uçuş Simülasyonu', gameModded:'Modlu Oyunlar', gameStream:'Yayın / Kayıt', gameMixed:'Genel Karışık Oyun',
    popularGame:'Popüler Oyun', gameCustom:'Manuel / karışık', popularGameHint:'Seçtiğin oyuna göre oyun türü ve sorun odağı otomatik ayarlanır.',
    secondaryGoal:'Şu An Yaşadığın Sorun', goalNone:'Net bir sorun yok', goalFps:'4K/1440p oyunda 60 FPS alamıyorum', goalVisuals:'Grafiği açınca FPS çok düşüyor',
    goalSmooth:'Takılma / FPS drop / 1% low sorunu', goalLatency:'Gecikme fazla, oyun geç tepki veriyor', goalStream:'Yayın veya kayıt performansı düşürüyor',
    goalFuture:'Sistem daha uzun süre götürsün', goalCheap:'En ucuz anlamlı çözümü bul',
    secBudget:'Yükseltme Bütçesi', budgetAmount:'Bütçe Miktarı', budgetPlaceholder:'örn. 500', currency:'Para Birimi',
    currencyUsd:'USD (US Dollar)', currencyEur:'EUR (Euro)', currencyTry:'TRY (Turkish Lira)',
    analyzeBtn:'Hadi En Fiyat Performans Seçeneği Bulalım',
    loadingTitle:'En Ucuz Mantıklı Parçalar Bulunuyor', loadingCopy:'Bu sistem için para harcamaya değen parçalar, ücretsiz çözümler ve alınmaması gereken yükseltmeler kontrol ediliyor.',
    resultProduct:'RigPilot · Analiz',
    resPerformance:'Performans Teşhisi', resFreeFixes:'Ücretsiz Performans Kontrolleri', resValidate:'Satın Almadan Önce Darboğazı Doğrula',
    resBest:'En Fiyat/Performans Hamle', resPsu:'Sonraki GPU Seviyesi İçin Önerilen PSU', resBudget:'Bütçe Eşleşmesi ve Fiyat Gerçeği',
    resDnu:'Yükseltme Önermiyorum', resFinal:'Son Karar',
  }
};

function setLanguage(lang){
  currentLang = lang === 'tr' ? 'tr' : 'en';
  document.documentElement.lang = currentLang;
  document.title = I18N[currentLang].title;

  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    if (I18N[currentLang][key] !== undefined) node.textContent = I18N[currentLang][key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(node => {
    const key = node.getAttribute('data-i18n-html');
    if (I18N[currentLang][key] !== undefined) node.innerHTML = I18N[currentLang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    const key = node.getAttribute('data-i18n-placeholder');
    if (I18N[currentLang][key] !== undefined) node.setAttribute('placeholder', I18N[currentLang][key]);
  });

  const langSelect = el('lang');
  if (langSelect) langSelect.value = currentLang;

  // If results are already visible, regenerate them in the selected language.
  if (el('result') && el('result').classList.contains('show')) analyze(true);
}

function inTr(en, tr){ return currentLang === 'tr' ? tr : en; }
function groupLabel(g){
  if (currentLang !== 'tr') return g;
  return {
    'Windows':'Windows',
    'GPU':'GPU',
    'CPU':'CPU',
    'Memory':'Bellek',
    'Storage / Stutter':'Depolama / Stutter',
    'Confirm GPU Bottleneck':'GPU Darboğazını Doğrula',
    'Confirm CPU Bottleneck':'CPU Darboğazını Doğrula',
    'Confirm RAM Issue':'RAM Sorununu Doğrula',
    'PSU / Stability Check':'PSU / Stabilite Kontrolü',
    'Warning':'Uyarı',
    'Stutter & Frametime':'Stutter ve Frametime',
    'General Checks':'Genel Kontroller',
    'Cooling / Thermals':'Soğutma / Sıcaklık',
    'Laptop Cooling':'Laptop Soğutması',
    'Display / Monitor':'Ekran / Monitör',
    'Windows Version':'Windows Sürümü',
    'Storage Upgrade':'Depolama Yükseltmesi',
    'Cooling Validation':'Soğutma Doğrulaması',
  }[g] || g;
}
