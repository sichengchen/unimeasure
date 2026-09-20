import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const VALID_BUMPS = new Set(["major", "minor", "patch"]);

export function nextVersion(currentVersion, bump) {
  if (!VALID_BUMPS.has(bump)) {
    throw new Error(`Version bump must be one of: major, minor, patch. Received: ${bump || "(empty)"}`);
  }
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(currentVersion);
  if (!match) throw new Error(`Expected a stable semantic version, received: ${currentVersion}`);

  let [, major, minor, patch] = match.map(Number);
  if (bump === "major") [major, minor, patch] = [major + 1, 0, 0];
  if (bump === "minor") [minor, patch] = [minor + 1, 0];
  if (bump === "patch") patch += 1;
  return `${major}.${minor}.${patch}`;
}

export async function bumpProjectVersion(bump, root = projectRoot) {
  const packagePath = join(root, "package.json");
  const manifestPath = join(root, "manifest.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  if (packageJson.version !== manifest.version) {
    throw new Error(`Version mismatch: package.json is ${packageJson.version}, manifest.json is ${manifest.version}.`);
  }

  const version = nextVersion(packageJson.version, bump);
  packageJson.version = version;
  manifest.version = version;
  await Promise.all([
    writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`),
    writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  ]);
  return version;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const version = await bumpProjectVersion(process.argv[2]);
  process.stdout.write(`${version}\n`);
}
