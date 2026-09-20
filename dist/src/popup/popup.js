(function initializePopup() {
  const { sanitizeSettings, normalizeHostname, isSiteExcluded } = globalThis.MeasuremateSettings;
  const platform = globalThis.MeasurematePlatform;
  const siteToggle = document.querySelector("#site-enabled");
  const direction = document.querySelector("#direction");
  const conversionMode = document.querySelector("#conversion-mode");
  const smartModeRow = document.querySelector("#smart-mode-row");
  const smartMode = document.querySelector("#smart-mode");
  const physicsRow = document.querySelector("#physics-row");
  const physicsMode = document.querySelector("#physics-mode");
  const precision = document.querySelector("#precision");
  const standard = document.querySelector("#standard");
  const highlight = document.querySelector("#highlight");
  const settingsButton = document.querySelector("#settings");
  let activeTab;
  let hostname = "";
  let settings;

  async function getActiveTab() {
    return platform.getActiveTab();
  }

  async function saveSettings(patch) {
    settings = sanitizeSettings({ ...settings, ...patch });
    await platform.setSettings(settings);
    if (activeTab?.id !== undefined) {
      try { await platform.sendTabMessage(activeTab.id, { type: "measuremate:refresh", settings }); }
      catch { /* The page may not allow content scripts yet. */ }
    }
  }

  async function refreshStatus() {
    if (!activeTab?.id || !/^https?:/.test(activeTab.url || "")) {
      document.body.classList.add("is-unavailable");
      siteToggle.disabled = true;
      return;
    }
    try {
      const status = await platform.sendTabMessage(activeTab.id, { type: "measuremate:get-status" });
      siteToggle.checked = status.enabled;
    } catch { /* The page may need to be reloaded before its status is available. */ }
  }

  siteToggle.addEventListener("change", async () => {
    const excluded = new Set(settings.excludedSites);
    if (siteToggle.checked) excluded.delete(hostname);
    else excluded.add(hostname);
    await saveSettings({ excludedSites: [...excluded] });
    await refreshStatus();
  });

  precision.addEventListener("change", () => saveSettings({ precision: precision.value }));
  function renderSmartMode() {
    smartModeRow.hidden = conversionMode.value === "manual";
  }

  conversionMode.addEventListener("change", () => {
    renderSmartMode();
    saveSettings({ conversionMode: conversionMode.value });
  });
  smartMode.addEventListener("change", () => saveSettings({ smartMode: smartMode.checked }));
  direction.addEventListener("change", () => {
    physicsRow.hidden = direction.value !== "metric";
    saveSettings({ direction: direction.value });
  });
  physicsMode.addEventListener("change", () => saveSettings({ physicsMode: physicsMode.checked }));
  standard.addEventListener("change", () => saveSettings({ standard: standard.value }));
  highlight.addEventListener("change", () => saveSettings({ highlight: highlight.checked }));
  settingsButton.addEventListener("click", () => platform.openOptionsPage());

  async function start() {
    const [stored, tab] = await Promise.all([platform.getSettings(), getActiveTab()]);
    settings = sanitizeSettings(stored);
    activeTab = tab;
    try { hostname = normalizeHostname(new URL(tab.url).hostname); } catch { hostname = ""; }
    precision.value = settings.precision;
    conversionMode.value = settings.conversionMode;
    smartMode.checked = settings.smartMode;
    renderSmartMode();
    direction.value = settings.direction;
    physicsMode.checked = settings.physicsMode;
    physicsRow.hidden = settings.direction !== "metric";
    standard.value = settings.standard;
    highlight.checked = settings.highlight;
    siteToggle.checked = settings.enabledByDefault && !isSiteExcluded(hostname, settings.excludedSites);
    await refreshStatus();
  }

  start();
})();
