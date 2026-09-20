(function initializePlatform(global) {
  const extensionChrome = global.chrome?.storage?.local && global.chrome?.runtime;
  const mockStorageListeners = new Set();
  const mockMessageListeners = new Set();

  if (!extensionChrome && global.addEventListener) {
    global.addEventListener("storage", (event) => {
      if (event.key !== "measuremate:settings") return;
      let nextValue;
      let oldValue;
      try { nextValue = JSON.parse(event.newValue || "null"); } catch { nextValue = undefined; }
      try { oldValue = JSON.parse(event.oldValue || "null"); } catch { oldValue = undefined; }
      mockStorageListeners.forEach((listener) => listener(nextValue, oldValue));
    });
  }

  async function getSettings() {
    if (extensionChrome) return (await global.chrome.storage.local.get("settings")).settings;
    try { return JSON.parse(global.localStorage?.getItem("measuremate:settings") || "null"); }
    catch { return undefined; }
  }

  async function setSettings(settings) {
    if (extensionChrome) return global.chrome.storage.local.set({ settings });
    const oldValue = await getSettings();
    global.localStorage?.setItem("measuremate:settings", JSON.stringify(settings));
    mockStorageListeners.forEach((listener) => listener(settings, oldValue));
  }

  function onSettingsChanged(listener) {
    if (extensionChrome) {
      global.chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.settings) listener(changes.settings.newValue, changes.settings.oldValue);
      });
      return;
    }
    mockStorageListeners.add(listener);
  }

  function onMessage(listener) {
    if (extensionChrome) global.chrome.runtime.onMessage.addListener(listener);
    else mockMessageListeners.add(listener);
  }

  async function sendMessage(message) {
    if (extensionChrome) return global.chrome.runtime.sendMessage(message);
    for (const listener of mockMessageListeners) {
      const response = await new Promise((resolve) => {
        const returned = listener(message, {}, resolve);
        if (returned !== true) queueMicrotask(() => resolve(returned));
      });
      if (response !== undefined) return response;
    }
  }

  async function sendTabMessage(tabId, message) {
    if (extensionChrome) return global.chrome.tabs.sendMessage(tabId, message);
    for (const listener of mockMessageListeners) {
      const response = await new Promise((resolve) => {
        const returned = listener(message, {}, resolve);
        if (returned !== true) queueMicrotask(() => resolve(returned));
      });
      if (response !== undefined) return response;
    }
    const settings = global.MeasuremateSettings?.sanitizeSettings(await getSettings());
    const enabled = settings ? settings.enabledByDefault && !global.MeasuremateSettings.isSiteExcluded("example.com", settings.excludedSites) : true;
    return { enabled, count: 18, hostname: "example.com" };
  }

  async function getActiveTab() {
    if (extensionChrome) {
      const [tab] = await global.chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    }
    return { id: 1, url: "https://example.com/products" };
  }

  function openOptionsPage() {
    if (extensionChrome) global.chrome.runtime.openOptionsPage();
    else global.location.href = "../options/options.html";
  }

  global.MeasurematePlatform = {
    getActiveTab,
    getSettings,
    isExtension: Boolean(extensionChrome),
    onMessage,
    onSettingsChanged,
    openOptionsPage,
    sendMessage,
    sendTabMessage,
    setSettings
  };
})(globalThis);
