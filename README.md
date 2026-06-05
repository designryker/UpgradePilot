# UpgradePilot

UpgradePilot is a Vite-based PC upgrade advisor focused on helping users know what to upgrade before they spend money.

It currently includes:

- EN/TR language support
- Guided upgrade flow
- Free Boost Path before paid recommendations
- CPU/GPU autocomplete and quick picks
- Budget-aware upgrade advice
- Desktop/laptop mode handling
- Rough market estimate disclaimers

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The production build is generated in `dist/`.

## Cloudflare Pages

Use these settings after connecting the GitHub repository:

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`

## Notes

Prices and performance gains are rough estimates, not live market data or guaranteed benchmark results.
