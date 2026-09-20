import test from "node:test";
import assert from "node:assert/strict";

import { nextVersion } from "../scripts/bump-version.mjs";

test("bumps major, minor, and patch semantic versions", () => {
  assert.equal(nextVersion("1.2.3", "major"), "2.0.0");
  assert.equal(nextVersion("1.2.3", "minor"), "1.3.0");
  assert.equal(nextVersion("1.2.3", "patch"), "1.2.4");
});

test("rejects unknown bump types and unstable version strings", () => {
  assert.throws(() => nextVersion("1.2.3", "build"), /major, minor, patch/);
  assert.throws(() => nextVersion("v1.2.3", "patch"), /stable semantic version/);
});
