(function initializeSettings(global) {
  const DEFAULT_SETTINGS = Object.freeze({
    enabledByDefault: true,
    conversionMode: "automatic",
    smartMode: false,
    direction: "metric",
    physicsMode: false,
    precision: "smart",
    standard: "us",
    highlight: true,
    excludedSites: [],
    smartProvider: "typesafe",
    smartApiKey: "",
    openRouterModel: "~typesafe/jev-latest",
    customEndpoint: "",
    customModelId: ""
  });

  function normalizeHostname(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .replace(/:\d+$/, "");
  }

  function sanitizeSettings(value = {}) {
    value = value && typeof value === "object" ? value : {};
    const precision = ["smart", "0", "1", "2", "3", "4"].includes(String(value.precision))
      ? String(value.precision)
      : DEFAULT_SETTINGS.precision;
    const standard = value.standard === "uk" ? "uk" : "us";
    const direction = value.direction === "imperial" ? "imperial" : "metric";
    const legacySmartMode = value.conversionMode === "smart";
    const conversionMode = ["automatic", "manual"].includes(value.conversionMode)
      ? value.conversionMode
      : DEFAULT_SETTINGS.conversionMode;
    const smartProvider = ["typesafe", "openrouter", "custom"].includes(value.smartProvider)
      ? value.smartProvider
      : DEFAULT_SETTINGS.smartProvider;
    const openRouterModel = ["~typesafe/jev-latest", "typesafe/jev-1.13"].includes(value.openRouterModel)
      ? value.openRouterModel
      : DEFAULT_SETTINGS.openRouterModel;
    const excludedSites = Array.from(
      new Set((Array.isArray(value.excludedSites) ? value.excludedSites : []).map(normalizeHostname).filter(Boolean))
    ).sort();

    return {
      enabledByDefault: value.enabledByDefault !== false,
      conversionMode,
      smartMode: value.smartMode === true || legacySmartMode,
      direction,
      physicsMode: value.physicsMode === true,
      precision,
      standard,
      highlight: value.highlight !== false,
      excludedSites,
      smartProvider,
      smartApiKey: typeof value.smartApiKey === "string" ? value.smartApiKey.trim() : "",
      openRouterModel,
      customEndpoint: typeof value.customEndpoint === "string" ? value.customEndpoint.trim() : "",
      customModelId: typeof value.customModelId === "string" ? value.customModelId.trim() : ""
    };
  }

  function isSiteExcluded(hostname, excludedSites) {
    const normalized = normalizeHostname(hostname);
    return excludedSites.some((site) => normalized === site || normalized.endsWith(`.${site}`));
  }

  global.MeasuremateSettings = {
    DEFAULT_SETTINGS,
    normalizeHostname,
    sanitizeSettings,
    isSiteExcluded
  };
})(globalThis);
