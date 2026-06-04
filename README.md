# RigPilot

RigPilot is a Vite-based PC performance and upgrade advisor focused on budget-conscious desktop and laptop upgrade decisions.

It currently includes:

- EN/TR language support
- Guided upgrade flow
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
