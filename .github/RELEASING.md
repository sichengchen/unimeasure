# Releasing UniMeasure

## Package locally

Run:

```sh
pnpm package:crx
```

The signed CRX3 is written to `artifacts/UniMeasure-<version>.crx`. The first run creates `.crx/unimeasure.pem`. Keep this ignored private key safe and reuse it for every release so the extension ID remains stable.

Run `pnpm package:zip` to create `artifacts/UniMeasure-<version>.zip`. Chrome users on macOS and Windows can extract this archive and install it with **Load unpacked** from `chrome://extensions`; those platforms reject directly installed self-hosted CRX files.

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

The workflow updates `package.json` and `manifest.json`, tests and builds the bumped version, creates both the signed CRX and unpacked-install ZIP, commits the generated version files, creates and pushes the matching `v<version>` tag, stores both packages as workflow artifacts, and attaches them to a GitHub Release.
