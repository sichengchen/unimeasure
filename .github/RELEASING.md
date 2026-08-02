# Releasing UniMeasure

## Package locally

Run:

```sh
pnpm package:crx
```

The signed CRX3 is written to `artifacts/UniMeasure-<version>.crx`. The first run creates `.crx/unimeasure.pem`. Keep this ignored private key safe and reuse it for every release so the extension ID remains stable.

Set `CHROME_PATH` when Chrome or Chromium is installed in a non-standard location. Set `UNIMEASURE_CRX_KEY` to package with an existing PEM key.

## Configure GitHub Actions

Add a repository Actions secret named `CRX_PRIVATE_KEY_BASE64` containing the signing key as one base64 line:

```sh
base64 < .crx/unimeasure.pem | tr -d '\n'
```

## Publish

Push a tag matching the version in `manifest.json`:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The **Release CRX** workflow tests the extension, validates the tag, creates the CRX, stores it as a workflow artifact, and attaches it to a GitHub Release. It can also be dispatched manually with an existing tag.
