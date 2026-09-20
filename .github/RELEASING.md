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

Open **Actions → Cut CRX Release → Run workflow**, choose the release branch, and select one version bump:

- `major` — for example, `1.2.0` → `2.0.0`
- `minor` — for example, `1.2.0` → `1.3.0`
- `patch` — for example, `1.2.0` → `1.2.1`

The workflow updates `package.json` and `manifest.json`, tests and builds the bumped version, commits the generated version files, creates and pushes the matching `v<version>` tag, creates the signed CRX, stores it as a workflow artifact, and attaches it to a GitHub Release.
