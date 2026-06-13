const GPU_ARTWORK = `
  <svg class="result-component-svg result-gpu-artwork" viewBox="0 0 720 300" role="img" aria-label="Graphics card illustration">
    <g fill="none" stroke="currentColor" stroke-width="4">
      <path d="M84 48h530l28 28v170H84z"/>
      <path d="M84 82H48v128h36M48 108H24v28h24M48 164H24v28h24"/>
      <path d="M180 246v25h248v-25M458 246v25h76"/>
      <circle cx="260" cy="146" r="76"/><circle cx="260" cy="146" r="24"/>
      <circle cx="490" cy="146" r="76"/><circle cx="490" cy="146" r="24"/>
      <path d="M260 70c26 20 35 45 24 74M336 146c-20 26-45 35-74 24M260 222c-26-20-35-45-24-74M184 146c20-26 45-35 74-24"/>
      <path d="M490 70c26 20 35 45 24 74M566 146c-20 26-45 35-74 24M490 222c-26-20-35-45-24-74M414 146c20-26 45-35 74-24"/>
      <path d="M105 66h88M555 66h42M604 204h20"/>
    </g>
  </svg>`;

const CPU_ARTWORK = `
  <svg class="result-component-svg result-cpu-artwork" viewBox="0 0 520 320" role="img" aria-label="Processor illustration">
    <g fill="none" stroke="currentColor" stroke-width="4">
      <rect x="120" y="38" width="280" height="244" rx="24"/>
      <rect x="166" y="82" width="188" height="156" rx="18"/>
      <path d="M120 82H84M120 122H84M120 162H84M120 202H84M120 242H84"/>
      <path d="M436 82h-36M436 122h-36M436 162h-36M436 202h-36M436 242h-36"/>
      <path d="M166 38V12M212 38V12M258 38V12M304 38V12M350 38V12"/>
      <path d="M166 308v-26M212 308v-26M258 308v-26M304 308v-26M350 308v-26"/>
      <path d="M202 126h116v68H202zM226 148h68"/>
      <circle cx="144" cy="62" r="7"/><circle cx="376" cy="258" r="7"/>
    </g>
  </svg>`;

export function getResultArtwork(kind) {
  if (kind === 'gpu') return GPU_ARTWORK;
  if (kind === 'cpu') return CPU_ARTWORK;
  return '';
}

export function renderResultArtwork(container, kind) {
  if (!container) return;
  const safeKind = kind === 'gpu' || kind === 'cpu' ? kind : '';
  container.dataset.artwork = safeKind;
  container.hidden = !safeKind;
  container.innerHTML = getResultArtwork(safeKind);
}
