(function initializeContentScript() {
  const { findConversions } = globalThis.MeasuremateConverter;
  const { sanitizeSettings, isSiteExcluded } = globalThis.MeasuremateSettings;
  const platform = globalThis.MeasurematePlatform;
  const EXCLUDED_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE", "PRE", "KBD", "SAMP", "SVG", "MATH"
  ]);
  const ANNOTATION_CLASS = "measuremate-annotation";
  const SEPARATOR_CLASS = "measuremate-annotation-separator";
  const HIGHLIGHT_CLASS = "measuremate-annotation--highlighted";
  let settings;
  let enabled = false;
  let conversionCount = 0;
  let observer;
  let processing = false;
  const pendingRoots = new Set();

  function shouldSkipTextNode(node) {
    const parent = node.parentElement;
    if (!parent || !node.nodeValue?.trim() || !/\d/.test(node.nodeValue)) return true;
    if (EXCLUDED_TAGS.has(parent.tagName)) return true;
    if (parent.closest(`.${ANNOTATION_CLASS}, [contenteditable]:not([contenteditable="false"]), [data-measuremate-ignore]`)) return true;
    return false;
  }

  function replaceTextNode(node) {
    if (shouldSkipTextNode(node)) return 0;

    let sibling = node.nextSibling;
    while (sibling) {
      const isMarkedSeparator = sibling.classList?.contains(SEPARATOR_CLASS);
      const isLegacySeparator = sibling.nodeType === Node.TEXT_NODE && !sibling.nodeValue.trim();
      const separator = isMarkedSeparator || isLegacySeparator ? sibling : null;
      const annotation = separator ? separator.nextSibling : sibling;
      if (!annotation?.classList?.contains(ANNOTATION_CLASS)) break;

      const nextSibling = annotation.nextSibling;
      separator?.remove();
      annotation.remove();
      conversionCount = Math.max(0, conversionCount - 1);
      sibling = nextSibling;
    }

    const text = node.nodeValue;
    const conversions = findConversions(text, settings);
    if (conversions.length === 0) return 0;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const conversion of conversions) {
      fragment.append(document.createTextNode(text.slice(cursor, conversion.end)));
      const separator = conversion.annotation.match(/^\s*/)?.[0] || "";
      if (separator) {
        const separatorElement = document.createElement("span");
        separatorElement.className = SEPARATOR_CLASS;
        separatorElement.setAttribute("aria-hidden", "true");
        separatorElement.textContent = separator;
        fragment.append(separatorElement);
      }
      const annotation = document.createElement("span");
      annotation.className = settings.highlight ? `${ANNOTATION_CLASS} ${HIGHLIGHT_CLASS}` : ANNOTATION_CLASS;
      annotation.dataset.measuremateUnit = conversion.unitId;
      annotation.setAttribute("aria-label", `converted equivalent: ${conversion.converted}`);
      annotation.textContent = conversion.annotation.slice(separator.length);
      fragment.append(annotation);
      cursor = conversion.end;
    }
    fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
    return conversions.length;
  }

  function convertRoot(root) {
    if (!enabled || processing || !root?.isConnected) return;
    processing = true;
    observer?.disconnect();
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        conversionCount += replaceTextNode(root);
      } else if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => shouldSkipTextNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (const node of nodes) conversionCount += replaceTextNode(node);
      }
    } finally {
      processing = false;
      observe();
    }
  }

  function clearAnnotations() {
    observer?.disconnect();
    document.querySelectorAll(`.${ANNOTATION_CLASS}`).forEach((annotation) => annotation.remove());
    document.querySelectorAll(`.${SEPARATOR_CLASS}`).forEach((separator) => separator.remove());
    document.body?.normalize();
    conversionCount = 0;
    observe();
  }

  function observe() {
    if (!observer || !enabled || !document.body) return;
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function scheduleRoot(root) {
    if (!root || root.parentElement?.closest?.(`.${ANNOTATION_CLASS}`)) return;
    pendingRoots.add(root.nodeType === Node.TEXT_NODE ? root : root);
    queueMicrotask(() => {
      const roots = [...pendingRoots];
      pendingRoots.clear();
      roots.forEach(convertRoot);
    });
  }

  async function applySettings(nextSettings, forceRebuild = false) {
    settings = sanitizeSettings(nextSettings);
    const nextEnabled = settings.enabledByDefault && !isSiteExcluded(location.hostname, settings.excludedSites);
    const stateChanged = nextEnabled !== enabled;
    enabled = nextEnabled;
    if ((!enabled && stateChanged) || forceRebuild) clearAnnotations();
    if (enabled && (stateChanged || forceRebuild || conversionCount === 0)) convertRoot(document.body);
  }

  observer = new MutationObserver((mutations) => {
    if (processing || !enabled) return;
    for (const mutation of mutations) {
      if (mutation.type === "characterData") scheduleRoot(mutation.target);
      for (const node of mutation.addedNodes) scheduleRoot(node);
    }
  });

  platform.onMessage((message, _sender, sendResponse) => {
    if (message?.type === "measuremate:get-status") {
      sendResponse({ enabled, count: document.querySelectorAll(`.${ANNOTATION_CLASS}`).length, hostname: location.hostname });
      return false;
    }
    if (message?.type === "measuremate:refresh") {
      applySettings(message.settings, true).then(() => sendResponse({ enabled, count: conversionCount }));
      return true;
    }
    return false;
  });

  platform.onSettingsChanged((nextSettings) => applySettings(nextSettings, true));

  platform.getSettings().then((stored) => applySettings(stored));
})();
