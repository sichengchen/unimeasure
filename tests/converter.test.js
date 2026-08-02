import test from "node:test";
import assert from "node:assert/strict";

await import("../src/shared/settings.js");
await import("../src/shared/converter.js");

const { annotateText, findConversions, parseNumber } = globalThis.MeasuremateConverter;

test("parses decimals, mixed fractions, simple fractions, and unicode fractions", () => {
  assert.equal(parseNumber("48"), 48);
  assert.equal(parseNumber("10 1/4"), 10.25);
  assert.equal(parseNumber("3/8"), 0.375);
  assert.equal(parseNumber("2½"), 2.5);
  assert.equal(parseNumber("-2 1/2"), -2.5);
});

test("converts all requested inch spellings while preserving original text", () => {
  assert.equal(annotateText('48"'), '48" (121.92 cm)');
  assert.equal(annotateText('48 "'), '48 " (121.92 cm)');
  assert.equal(annotateText('10 1/4 "'), '10 1/4 " (26.04 cm)');
  assert.equal(annotateText("48 in"), "48 in (121.92 cm)");
  assert.equal(annotateText("48 in."), "48 in. (121.92 cm)");
  assert.equal(annotateText("48 inch"), "48 inch (121.92 cm)");
  assert.equal(annotateText("48 inches"), "48 inches (121.92 cm)");
  assert.equal(annotateText("48″"), "48″ (121.92 cm)");
  assert.equal(annotateText("48”"), "48” (121.92 cm)");
});

test("converts compound feet and inches once", () => {
  assert.equal(annotateText(`5' 10"`), `5' 10" (177.8 cm)`);
  assert.equal(annotateText("6 ft 2 in"), "6 ft 2 in (187.96 cm)");
});

test("covers length, area, volume, mass, temperature, speed, pressure, energy and fuel economy", () => {
  const input = "3 mi, 2 acres, 1 gal, 12 lb, 68°F, 55 mph, 30 psi, 2 BTU, 25 mpg";
  const output = annotateText(input);
  assert.match(output, /3 mi \(4\.83 km\)/);
  assert.match(output, /2 acres \(0\.809 ha\)/);
  assert.match(output, /1 gal \(3\.79 L\)/);
  assert.match(output, /12 lb \(5\.44 kg\)/);
  assert.match(output, /68°F \(20 °C\)/);
  assert.match(output, /55 mph \(88\.51 km\/h\)/);
  assert.match(output, /30 psi \(206\.84 kPa\)/);
  assert.match(output, /2 BTU \(2\.11 kJ\)/);
  assert.match(output, /25 mpg \(9\.41 L\/100 km\)/);
});

test("prioritizes compound units over shorter unit prefixes", () => {
  assert.equal(annotateText("10 lb-ft"), "10 lb-ft (13.56 N·m)");
  assert.equal(annotateText("20 pound-force"), "20 pound-force (88.96 N)");
  assert.equal(annotateText("3 gallons per minute"), "3 gallons per minute (11.36 L/min)");
  assert.equal(annotateText("9 ft/s²"), "9 ft/s² (2.74 m/s²)");
});

test("uses the selected regional volume standard", () => {
  assert.equal(annotateText("1 gal", { standard: "us" }), "1 gal (3.79 L)");
  assert.equal(annotateText("1 gal", { standard: "uk" }), "1 gal (4.55 L)");
  assert.equal(annotateText("1 imperial gallon", { standard: "us" }), "1 imperial gallon (4.55 L)");
});

test("supports configurable precision", () => {
  assert.equal(annotateText("1 in", { precision: "0" }), "1 in (3 cm)");
  assert.equal(annotateText("1 in", { precision: "3" }), "1 in (2.54 cm)");
});

test("does not duplicate an existing metric equivalent", () => {
  assert.equal(annotateText("48 in (121.92 cm)"), "48 in (121.92 cm)");
});

test("returns stable ordered ranges for multiple measurements", () => {
  const results = findConversions("A 12 lb box is 2 ft wide.");
  assert.deepEqual(results.map((result) => result.unitId), ["pound", "foot"]);
  assert.deepEqual(results.map((result) => result.original), ["12 lb", "2 ft"]);
});

test("converts metric measurements to imperial across categories", () => {
  const input = "3 km, 2 m², 1 L, 12 kg, 20°C, 90 km/h, 200 kPa, 2 kJ, 8 L/100 km";
  const output = annotateText(input, { direction: "imperial" });
  assert.match(output, /3 km \(1\.86 mi\)/);
  assert.match(output, /2 m² \(21\.53 sq ft\)/);
  assert.match(output, /1 L \(0\.264 gal\)/);
  assert.match(output, /12 kg \(26\.46 lb\)/);
  assert.match(output, /20°C \(68 °F\)/);
  assert.match(output, /90 km\/h \(55\.92 mph\)/);
  assert.match(output, /200 kPa \(29\.01 psi\)/);
  assert.match(output, /2 kJ \(1\.9 BTU\)/);
  assert.match(output, /8 L\/100 km \(29\.4 mpg\)/);
});

test("uses US or UK output units in metric-to-imperial mode", () => {
  assert.equal(annotateText("1 L", { direction: "imperial", standard: "us" }), "1 L (0.264 gal)");
  assert.equal(annotateText("1 L", { direction: "imperial", standard: "uk" }), "1 L (0.22 gal)");
  assert.equal(annotateText("1 t", { direction: "imperial", standard: "us" }), "1 t (1.1 US ton)");
  assert.equal(annotateText("1 t", { direction: "imperial", standard: "uk" }), "1 t (0.984 long ton)");
});

test("does not duplicate an existing imperial equivalent", () => {
  assert.equal(annotateText("30 cm (11.81 in)", { direction: "imperial" }), "30 cm (11.81 in)");
});

test("converts dimension chains that share one trailing unit", () => {
  assert.equal(
    annotateText('10 1/4x18 7/8x30 3/8 "'),
    '10 1/4x18 7/8x30 3/8 " (26.04 × 47.94 × 77.15 cm)'
  );
  assert.equal(
    annotateText("10 by 20 by 30 inches"),
    "10 by 20 by 30 inches (25.4 × 50.8 × 76.2 cm)"
  );
  assert.equal(
    annotateText("120 × 60 × 30 cm", { direction: "imperial" }),
    "120 × 60 × 30 cm (47.24 × 23.62 × 11.81 in)"
  );
});
