(function initializeSmart(global) {
  const TYPESAFE_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
  const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";

  function getProviderConfig(settings) {
    if (settings.smartProvider === "openrouter") {
      return { endpoint: OPENROUTER_ENDPOINT, model: settings.openRouterModel };
    }
    if (settings.smartProvider === "custom") {
      return { endpoint: settings.customEndpoint, model: settings.customModelId };
    }
    return { endpoint: TYPESAFE_ENDPOINT, model: "jev-latest" };
  }

  function buildDecisionRequest(candidates, settings) {
    const { model } = getProviderConfig(settings);
    const state = {
      description: "Possible physical measurements found on a web page.",
      candidates: candidates.map(({ id, measurement, context }) => ({ id, measurement, context }))
    };
    const questions = Object.fromEntries(candidates.map(({ id }) => [id, {
      type: "noul",
      instructions: {
        candidate_id: id,
        question: "In `state.candidates`, does the candidate with `candidate_id` unambiguously express a physical measurement whose unit should be converted for the reader? Use its surrounding context."
      },
      criteria: {
        true: "The number and unit clearly form a physical measurement, such as a length, mass, temperature, speed, volume, area, pressure, energy, power, force, torque, flow, or fuel economy.",
        false: "The match is incidental or ambiguous, including a word such as 'in', an ordinal, identifier, date, score, count, name, abbreviation with a non-measurement meaning, or insufficient context."
      }
    }]));
    return { model, state, questions };
  }

  function parseDecisions(payload, candidates, threshold = 0.5) {
    const answers = payload?.answers && typeof payload.answers === "object" ? payload.answers : {};
    return candidates.map(({ id }) => Number(answers[id]?.noul) >= threshold);
  }

  global.MeasuremateSmart = {
    TYPESAFE_ENDPOINT,
    OPENROUTER_ENDPOINT,
    buildDecisionRequest,
    getProviderConfig,
    parseDecisions
  };
})(globalThis);
