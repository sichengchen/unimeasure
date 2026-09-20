import test from "node:test";
import assert from "node:assert/strict";

await import("../src/shared/settings.js");
await import("../src/shared/smart.js");

const { sanitizeSettings } = globalThis.MeasuremateSettings;
const { buildDecisionRequest, getProviderConfig, parseDecisions } = globalThis.MeasuremateSmart;

test("builds one typed Noul decision per regex candidate", () => {
  const candidates = [
    { id: "candidate_0", measurement: "20 in", context: "The team scored 20 in 2026." },
    { id: "candidate_1", measurement: "10 in", context: "The shelf is 10 in wide." }
  ];
  const request = buildDecisionRequest(candidates, sanitizeSettings());
  assert.equal(request.model, "jev-latest");
  assert.deepEqual(Object.keys(request.questions), ["candidate_0", "candidate_1"]);
  assert.equal(request.questions.candidate_0.type, "noul");
  assert.equal(request.state.candidates[1].context, "The shelf is 10 in wide.");
});

test("selects the correct fixed provider endpoints and model ids", () => {
  assert.deepEqual(getProviderConfig(sanitizeSettings({ smartProvider: "typesafe" })), {
    endpoint: "https://api.typesafe.ai/v1/systemone",
    model: "jev-latest"
  });
  assert.deepEqual(getProviderConfig(sanitizeSettings({
    smartProvider: "openrouter",
    openRouterModel: "typesafe/jev-1.13"
  })), {
    endpoint: "https://openrouter.ai/api/alpha/decisions",
    model: "typesafe/jev-1.13"
  });
});

test("accepts only candidates whose yes probability reaches the threshold", () => {
  const candidates = [{ id: "ambiguous" }, { id: "measurement" }, { id: "missing" }];
  const payload = { answers: {
    ambiguous: { type: "noul", noul: 0.08 },
    measurement: { type: "noul", noul: 0.94 }
  } };
  assert.deepEqual(parseDecisions(payload, candidates), [false, true, false]);
});
