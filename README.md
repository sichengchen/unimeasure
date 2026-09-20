# UniMeasure

UniMeasure is a dependency-light Chrome extension that converts imperial and US customary measurements to metric—or metric measurements to imperial—without replacing the original page text.

It supports two interaction modes:

- **Automatic** appends conversions as pages load.
- **Manual** converts selected text from **UniMeasure → Convert selection** in the browser context menu and shows the result in a compact page card.

Optional **Smart Mode** sends regex candidates and a short surrounding excerpt to Jev before automatic conversion, reducing false positives such as `scored 20 in 2026`. TypeSafe, OpenRouter (`Jev Latest` or `Jev 1.13`), and custom Jev-compatible endpoints are supported. Smart Mode requires the user's own API key.

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

Chrome on macOS and Windows does not permit direct installation of self-hosted CRX files. To install a GitHub release:

1. Download `UniMeasure-<version>.zip` from [GitHub Releases](https://github.com/sichengchen/unimeasure/releases/latest).
2. Extract the ZIP to a permanent folder.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Choose **Load unpacked** and select the extracted folder.

The CRX release asset is retained for Linux and enterprise-managed installations. Public one-click installation on macOS and Windows requires publishing through the Chrome Web Store.

## Development

```sh
pnpm install
pnpm check
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `dist` directory.

Run `pnpm dlx devpin run --wait -- pnpm dev` to view the conversion demo and UI surfaces during development.
