# Display And Memory Input Design

## Goal

Keep browser-resolution detection interactive while making its result visible and
more accurate, and only ask users to choose DDR4 versus DDR5 when the selected
CPU can genuinely use either memory generation.

## Display Detection

- Estimate physical display dimensions from `screen.width`, `screen.height`,
  and `devicePixelRatio` to account for common operating-system scaling.
- Map the estimated dimensions to 1080p, 1440p, or 4K.
- Update both the hidden resolution select and the visible resolution toggle.
- Dispatch the normal change event so the rest of the UI stays synchronized.
- Show concise feedback with the detected dimensions and chosen class.
- Treat the result as a browser estimate because multi-monitor setups and browser
  privacy behavior can still make it imperfect.

## Memory Compatibility

- Store explicit memory modes for every selectable CPU: `ddr4`, `ddr5`, or
  `both`.
- Hide the memory-type choice for DDR4-only and DDR5-only CPUs, automatically
  selecting the supported type.
- Show the memory-type choice only for `both` CPUs.
- Keep the choice hidden until a CPU is selected.
- Keep a short compatibility note visible so automatic choices are understandable.

## Verified Platform Rules

- Listed AMD AM4 desktop CPUs use DDR4.
- Listed AMD AM5 desktop CPUs, including Ryzen 5 7600, use DDR5.
- Listed Intel desktop LGA1700 CPUs from 12th, 13th, and 14th generations support
  DDR4 or DDR5 depending on motherboard.
- Listed Intel Core Ultra desktop CPUs use DDR5.
- Laptop CPUs use explicit per-model modes because mobile memory support differs
  by generation.

Primary references:

- Intel Core i5-13600KF specifications list DDR5-5600 and DDR4-3200:
  `https://www.intel.com/content/www/us/en/products/sku/230494/intel-core-i513600kf-processor-24m-cache-up-to-5-10-ghz/specifications.html`
- Intel Core i5-12400 specifications list DDR5-4800 and DDR4-3200:
  `https://www.intel.com/content/www/us/en/products/sku/134586/intel-core-i512400-processor-18m-cache-up-to-4-40-ghz/specifications.html`
- AMD Ryzen 5 7600 specifications list AM5 and DDR5:
  `https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html`

## Verification

- Unit checks cover scaled display detection and toggle synchronization contract.
- Unit checks cover representative DDR4-only, DDR5-only, and dual-memory CPUs.
- Every CPU in `CPU_SCORE` has explicit memory metadata.
- Production build and smoke checks pass.
