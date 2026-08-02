import { constants, access, chmod, copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const extensionDirectory = join(projectRoot, "dist");
const generatedCrx = `${extensionDirectory}.crx`;
const generatedKey = `${extensionDirectory}.pem`;
const keyDirectory = join(projectRoot, ".crx");
const managedKey = join(keyDirectory, "unimeasure.pem");
const artifactDirectory = join(projectRoot, "artifacts");
const configuredKey = process.env.UNIMEASURE_CRX_KEY
  ? resolve(process.env.UNIMEASURE_CRX_KEY)
  : managedKey;

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/opt/homebrew/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
    process.env.PROGRAMFILES && join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe")
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch { /* Try the next known browser location. */ }
  }

  throw new Error("Chrome or Chromium was not found. Set CHROME_PATH to its executable.");
}

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`CRX packer exited with ${signal || `code ${code}`}.`));
    });
  });
}

function artifactName(manifest) {
  const safeName = manifest.name.replace(/[^A-Za-z0-9._-]+/g, "-");
  return `${safeName}-${manifest.version}.crx`;
}

async function verifyCrx3(path) {
  const contents = await readFile(path);
  if (contents.length < 16 || contents.subarray(0, 4).toString("ascii") !== "Cr24") {
    throw new Error("The generated package is not a CRX file.");
  }
  if (contents.readUInt32LE(4) !== 3) {
    throw new Error("The generated package is not CRX3.");
  }
  const zipOffset = 12 + contents.readUInt32LE(8);
  if (zipOffset + 2 > contents.length || contents.subarray(zipOffset, zipOffset + 2).toString("ascii") !== "PK") {
    throw new Error("The generated CRX3 package has no valid ZIP payload.");
  }
}

const browser = await findBrowser();
const manifest = JSON.parse(await readFile(join(extensionDirectory, "manifest.json"), "utf8"));
const artifact = join(artifactDirectory, artifactName(manifest));
const hasConfiguredKey = await exists(configuredKey);

if (process.env.UNIMEASURE_CRX_KEY && !hasConfiguredKey) {
  throw new Error(`UNIMEASURE_CRX_KEY does not exist: ${configuredKey}`);
}

await mkdir(keyDirectory, { recursive: true });
await mkdir(artifactDirectory, { recursive: true });
await rm(generatedCrx, { force: true });
await rm(generatedKey, { force: true });

const browserProfile = await mkdtemp(join(tmpdir(), "unimeasure-crx-"));
const args = [
  "--headless=new",
  "--no-first-run",
  "--no-message-box",
  `--user-data-dir=${browserProfile}`,
  `--pack-extension=${extensionDirectory}`
];
if (hasConfiguredKey) args.push(`--pack-extension-key=${configuredKey}`);

try {
  await run(browser, args);
} finally {
  await rm(browserProfile, { recursive: true, force: true });
}

if (!await exists(generatedCrx)) {
  throw new Error(`Chrome did not create ${generatedCrx}.`);
}

if (!hasConfiguredKey) {
  if (!await exists(generatedKey)) throw new Error("Chrome did not create a signing key.");
  await copyFile(generatedKey, managedKey);
  await chmod(managedKey, 0o600);
  await rm(generatedKey, { force: true });
}

await verifyCrx3(generatedCrx);
await copyFile(generatedCrx, artifact);
await rm(generatedCrx, { force: true });

console.log(`Packed CRX3: ${artifact}`);
console.log(`Signing key: ${configuredKey}`);
