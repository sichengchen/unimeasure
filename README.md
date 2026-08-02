# UniMeasure

UniMeasure is a dependency-light Chrome extension that appends metric equivalents to imperial and US customary measurements—or imperial equivalents to metric measurements—without replacing the original page text.

Examples:

- `48"` → `48" (121.92 cm)`
- `10 1/4 "` → `10 1/4 " (26.04 cm)`
- `5' 10"` → `5' 10" (177.8 cm)`
- `12 lb` → `12 lb (5.44 kg)`
- `68°F` → `68°F (20 °C)`
- `120 cm` → `120 cm (47.24 in)` in Imperial mode
- `20°C` → `20°C (68 °F)` in Imperial mode

## Supported measurements

Both conversion directions support length, area, volume, mass, temperature, speed, acceleration, pressure, energy, power, force, torque, flow, and fuel economy. Common names, abbreviations, symbols, decimals, simple fractions, mixed fractions, and Unicode fractions are recognized. US customary and UK imperial standards are selectable.

## Install

Download the latest `UniMeasure-<version>.crx` from [GitHub Releases](https://github.com/sichengchen/imperial2metric/releases/latest), then install it from your browser's extensions page. Users should use the released CRX; loading the extension unpacked is intended only for development.

Chrome restricts extensions installed outside the Chrome Web Store on Windows and macOS. The released CRX can be installed directly in browsers and managed environments that permit local CRX installation.

Some ambiguous shorthand—such as `in`, `oz`, `ton`, and a bare quote—uses the most common interpretation. Code blocks, form controls, editable content, SVG, and MathML are left untouched. Add `data-measuremate-ignore` to any element that should never be processed.

## Development

```sh
pnpm install
pnpm check
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `dist` directory.

Run `pnpm dlx devpin run --wait -- pnpm dev` to view the conversion demo and UI surfaces during development.
