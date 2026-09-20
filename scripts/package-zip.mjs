import { mkdir, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const extensionDirectory = join(projectRoot, "dist");
const artifactDirectory = join(projectRoot, "artifacts");
const manifest = JSON.parse(await readFile(join(extensionDirectory, "manifest.json"), "utf8"));
const safeName = manifest.name.replace(/[^A-Za-z0-9._-]+/g, "-");
const artifact = join(artifactDirectory, `${safeName}-${manifest.version}.zip`);

function run(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`ZIP packer exited with ${signal || `code ${code}`}.`));
    });
  });
}

await mkdir(artifactDirectory, { recursive: true });
await rm(artifact, { force: true });
await run("zip", ["-q", "-r", artifact, "."], { cwd: extensionDirectory });

console.log(`Packed extension ZIP: ${artifact}`);
