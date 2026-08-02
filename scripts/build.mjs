import { cp, mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";

const output = new URL("../dist/", import.meta.url);
const files = ["manifest.json", "src", "icons"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of files) {
  const source = new URL(`../${file}`, import.meta.url);
  const destination = new URL(`../dist/${file}`, import.meta.url);
  await mkdir(dirname(destination.pathname), { recursive: true });
  await cp(source, destination, { recursive: true });
}

console.log("Built unpacked extension in dist/");
