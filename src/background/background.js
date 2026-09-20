importScripts("../shared/settings.js", "../shared/smart.js");

const MENU_ROOT = "measuremate-root";
const MENU_CONVERT = "measuremate-convert-selection";

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ROOT, title: "UniMeasure", contexts: ["selection"] });
    chrome.contextMenus.create({
      id: MENU_CONVERT,
      parentId: MENU_ROOT,
      title: "Convert selection",
      contexts: ["selection"]
    });
  });
}

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_CONVERT || tab?.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, {
    type: "measuremate:manual-convert",
    selectionText: info.selectionText || ""
  }).catch(() => {});
});

async function classifyCandidates(candidates) {
  const rawSettings = (await chrome.storage.local.get("settings")).settings;
  const settings = globalThis.MeasuremateSettings.sanitizeSettings(rawSettings);
  if (!settings.smartApiKey) throw new Error("Add an API key in UniMeasure settings to use Smart Mode.");

  const { endpoint, model } = globalThis.MeasuremateSmart.getProviderConfig(settings);
  if (!endpoint || !model) throw new Error("Complete the Smart Mode provider settings.");
  let url;
  try { url = new URL(endpoint); } catch { throw new Error("The custom endpoint is not a valid URL."); }
  if (!/^https?:$/.test(url.protocol)) throw new Error("The custom endpoint must use HTTP or HTTPS.");

  const response = await fetch(url.href, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.smartApiKey}`,
      "Content-Type": "application/json",
      ...(settings.smartProvider === "openrouter" ? {
        "HTTP-Referer": "https://github.com/sichengchen/imperial2metric",
        "X-OpenRouter-Title": "UniMeasure"
      } : {})
    },
    body: JSON.stringify(globalThis.MeasuremateSmart.buildDecisionRequest(candidates, settings))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.error?.message || payload?.detail || `Provider returned ${response.status}`;
    throw new Error(detail);
  }
  return globalThis.MeasuremateSmart.parseDecisions(payload, candidates);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "measuremate:classify") return false;
  classifyCandidates(Array.isArray(message.candidates) ? message.candidates.slice(0, 40) : [])
    .then((decisions) => sendResponse({ decisions }))
    .catch((error) => sendResponse({ decisions: [], error: error.message }));
  return true;
});
