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

## Use it

```sh
pnpm check
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `dist` directory.

## Package a CRX

```sh
pnpm package:crx
```

The signed CRX3 package is written to `artifacts/UniMeasure-<version>.crx`. The first run creates `.crx/unimeasure.pem`; keep that ignored private key safe and reuse it for every release so the extension ID remains stable.

Set `CHROME_PATH` when Chrome or Chromium is installed in a non-standard location. Set `UNIMEASURE_CRX_KEY` to package with an existing PEM key, such as in CI.

## Release from GitHub Actions

Add a repository Actions secret named `CRX_PRIVATE_KEY_BASE64` containing the signing key as one base64 line:

```sh
base64 < .crx/unimeasure.pem | tr -d '\n'
```

Push a tag matching the Chrome manifest version to test, package, and publish the CRX automatically:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The **Release CRX** workflow can also be run manually with an existing tag. It verifies the tag against `manifest.json`, uploads the CRX as a workflow artifact, and attaches it to a GitHub Release.

Some ambiguous shorthand—such as `in`, `oz`, `ton`, and a bare quote—uses the most common interpretation. Code blocks, form controls, editable content, SVG, and MathML are left untouched. Add `data-measuremate-ignore` to any element that should never be processed.

Run `pnpm dlx devpin run --wait -- pnpm dev` to view the conversion demo and UI surfaces during development.
