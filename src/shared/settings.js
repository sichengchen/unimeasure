(function initializeSettings(global) {
  const DEFAULT_SETTINGS = Object.freeze({
    enabledByDefault: true,
    direction: "metric",
    physicsMode: false,
    precision: "smart",
    standard: "us",
    highlight: true,
    excludedSites: []
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
    const excludedSites = Array.from(
      new Set((Array.isArray(value.excludedSites) ? value.excludedSites : []).map(normalizeHostname).filter(Boolean))
    ).sort();

    return {
      enabledByDefault: value.enabledByDefault !== false,
      direction,
      physicsMode: value.physicsMode === true,
      precision,
      standard,
      highlight: value.highlight !== false,
      excludedSites
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
