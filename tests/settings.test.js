import test from "node:test";
import assert from "node:assert/strict";

await import("../src/shared/settings.js");

const { isSiteExcluded, normalizeHostname, sanitizeSettings } = globalThis.MeasuremateSettings;

test("accepts empty first-run storage", () => {
  assert.deepEqual(sanitizeSettings(null), {
    enabledByDefault: true,
    direction: "metric",
    physicsMode: false,
    precision: "smart",
    standard: "us",
    highlight: true,
    excludedSites: []
  });
});

test("sanitizes the conversion direction", () => {
  assert.equal(sanitizeSettings({ direction: "imperial" }).direction, "imperial");
  assert.equal(sanitizeSettings({ direction: "unknown" }).direction, "metric");
});

test("normalizes hostnames and removes duplicate exclusions", () => {
  assert.equal(normalizeHostname("https://www.Example.com:8080/path"), "example.com");
  assert.deepEqual(
    sanitizeSettings({ excludedSites: ["Example.com", "www.example.com", "docs.example.com"] }).excludedSites,
    ["docs.example.com", "example.com"]
  );
});

test("site exclusions apply to subdomains", () => {
  assert.equal(isSiteExcluded("shop.example.com", ["example.com"]), true);
  assert.equal(isSiteExcluded("notexample.com", ["example.com"]), false);
});
