(function initializeOptions() {
  const { sanitizeSettings, normalizeHostname } = globalThis.MeasuremateSettings;
  const platform = globalThis.MeasurematePlatform;
  const form = document.querySelector("#settings-form");
  const enabled = document.querySelector("#enabled");
  const direction = document.querySelector("#direction");
  const physicsRow = document.querySelector("#physics-row");
  const physicsMode = document.querySelector("#physics-mode");
  const precision = document.querySelector("#precision");
  const standard = document.querySelector("#standard");
  const highlight = document.querySelector("#highlight");
  const exceptionInput = document.querySelector("#exception-input");
  const addException = document.querySelector("#add-exception");
  const exceptionList = document.querySelector("#exception-list");
  const status = document.querySelector("#save-status");
  let statusTimer;
  let excludedSites = new Set();

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
    exceptionInput.focus();
  }

  platform.getSettings().then((stored) => {
    const settings = sanitizeSettings(stored);
    enabled.checked = settings.enabledByDefault;
    direction.value = settings.direction;
    physicsMode.checked = settings.physicsMode;
    physicsRow.hidden = settings.direction !== "metric";
    precision.value = settings.precision;
    standard.value = settings.standard;
    highlight.checked = settings.highlight;
    excludedSites = new Set(settings.excludedSites);
    renderExceptions();
  });

  direction.addEventListener("change", () => {
    physicsRow.hidden = direction.value !== "metric";
  });

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
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const settings = sanitizeSettings({
      enabledByDefault: enabled.checked,
      direction: direction.value,
      physicsMode: physicsMode.checked,
      precision: precision.value,
      standard: standard.value,
      highlight: highlight.checked,
      excludedSites: [...excludedSites]
    });
    await platform.setSettings(settings);
    excludedSites = new Set(settings.excludedSites);
    renderExceptions();
    status.textContent = "Saved";
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ""; }, 1800);
  });
})();
