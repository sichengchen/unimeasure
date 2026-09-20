(function initializeOptions() {
  const { sanitizeSettings, normalizeHostname } = globalThis.MeasuremateSettings;
  const platform = globalThis.MeasurematePlatform;
  const enabled = document.querySelector("#enabled");
  const conversionMode = document.querySelector("#conversion-mode");
  const smartMode = document.querySelector("#smart-mode");
  const direction = document.querySelector("#direction");
  const physicsRow = document.querySelector("#physics-row");
  const physicsMode = document.querySelector("#physics-mode");
  const precision = document.querySelector("#precision");
  const standard = document.querySelector("#standard");
  const highlight = document.querySelector("#highlight");
  const smartSettings = document.querySelector("#smart-settings");
  const smartProvider = document.querySelector("#smart-provider");
  const smartApiKey = document.querySelector("#smart-api-key");
  const openRouterModelRow = document.querySelector("#openrouter-model-row");
  const openRouterModel = document.querySelector("#openrouter-model");
  const customEndpointRow = document.querySelector("#custom-endpoint-row");
  const customEndpoint = document.querySelector("#custom-endpoint");
  const customModelRow = document.querySelector("#custom-model-row");
  const customModelId = document.querySelector("#custom-model-id");
  const exceptionInput = document.querySelector("#exception-input");
  const addException = document.querySelector("#add-exception");
  const exceptionList = document.querySelector("#exception-list");
  let excludedSites = new Set();
  let saveQueue = Promise.resolve();

  function persistSettings() {
    const settings = sanitizeSettings({
      enabledByDefault: enabled.checked,
      conversionMode: conversionMode.value,
      smartMode: smartMode.checked,
      direction: direction.value,
      physicsMode: physicsMode.checked,
      precision: precision.value,
      standard: standard.value,
      highlight: highlight.checked,
      excludedSites: [...excludedSites],
      smartProvider: smartProvider.value,
      smartApiKey: smartApiKey.value,
      openRouterModel: openRouterModel.value,
      customEndpoint: customEndpoint.value,
      customModelId: customModelId.value
    });
    saveQueue = saveQueue.catch(() => {}).then(() => platform.setSettings(settings));
    return saveQueue;
  }

  function renderSmartSettings() {
    smartSettings.hidden = !smartMode.checked;
    openRouterModelRow.hidden = smartProvider.value !== "openrouter";
    customEndpointRow.hidden = smartProvider.value !== "custom";
    customModelRow.hidden = smartProvider.value !== "custom";
  }

  function renderExceptions() {
    exceptionList.replaceChildren();
    if (excludedSites.size === 0) {
      const empty = document.createElement("li");
      empty.className = "exception-empty";
      empty.textContent = "No exceptions";
      exceptionList.append(empty);
      return;
    }

    for (const hostname of [...excludedSites].sort()) {
      const item = document.createElement("li");
      item.className = "exception-item";
      const value = document.createElement("span");
      value.className = "exception-hostname";
      value.textContent = hostname;
      const remove = document.createElement("button");
      remove.className = "remove-exception";
      remove.type = "button";
      remove.dataset.hostname = hostname;
      remove.setAttribute("aria-label", `Remove ${hostname}`);
      remove.textContent = "Remove";
      item.append(value, remove);
      exceptionList.append(item);
    }
  }

  function addHostname() {
    const hostname = normalizeHostname(exceptionInput.value);
    if (!hostname) return;
    excludedSites.add(hostname);
    exceptionInput.value = "";
    renderExceptions();
    persistSettings();
    exceptionInput.focus();
  }

  platform.getSettings().then((stored) => {
    const settings = sanitizeSettings(stored);
    enabled.checked = settings.enabledByDefault;
    conversionMode.value = settings.conversionMode;
    smartMode.checked = settings.smartMode;
    direction.value = settings.direction;
    physicsMode.checked = settings.physicsMode;
    physicsRow.hidden = settings.direction !== "metric";
    precision.value = settings.precision;
    standard.value = settings.standard;
    highlight.checked = settings.highlight;
    smartProvider.value = settings.smartProvider;
    smartApiKey.value = settings.smartApiKey;
    openRouterModel.value = settings.openRouterModel;
    customEndpoint.value = settings.customEndpoint;
    customModelId.value = settings.customModelId;
    renderSmartSettings();
    excludedSites = new Set(settings.excludedSites);
    renderExceptions();
  });

  direction.addEventListener("change", () => {
    physicsRow.hidden = direction.value !== "metric";
    persistSettings();
  });

  conversionMode.addEventListener("change", () => {
    persistSettings();
  });
  smartMode.addEventListener("change", () => {
    renderSmartSettings();
    persistSettings();
  });
  smartProvider.addEventListener("change", () => {
    renderSmartSettings();
    persistSettings();
  });

  for (const control of [enabled, physicsMode, precision, standard, highlight, smartApiKey, openRouterModel, customEndpoint, customModelId]) {
    control.addEventListener("change", persistSettings);
  }

  addException.addEventListener("click", addHostname);
  exceptionInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addHostname();
  });
  exceptionList.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-exception");
    if (!button) return;
    excludedSites.delete(button.dataset.hostname);
    renderExceptions();
    persistSettings();
  });
})();
