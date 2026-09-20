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
  const RESULT_CLASS = "measuremate-manual-result";
  const SMART_BATCH_SIZE = 40;
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

  function replaceTextNode(node, acceptedIndexes = null) {
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
    const conversions = findConversions(text, settings).filter((_conversion, index) => !acceptedIndexes || acceptedIndexes.has(index));
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

  function collectTextNodes(root) {
    if (root.nodeType === Node.TEXT_NODE) return shouldSkipTextNode(root) ? [] : [root];
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => shouldSkipTextNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function candidateContext(node) {
    const text = node.parentElement?.innerText || node.nodeValue || "";
    return text.replace(/\s+/g, " ").trim().slice(0, 600);
  }

  async function replaceSmartTextNodes(nodes) {
    const entries = nodes.map((node) => ({
      node,
      text: node.nodeValue,
      conversions: findConversions(node.nodeValue, settings),
      accepted: new Set()
    })).filter(({ conversions }) => conversions.length > 0);
    const candidates = entries.flatMap((entry, entryIndex) => entry.conversions.map((conversion, conversionIndex) => ({
      id: `candidate_${entryIndex}_${conversionIndex}`,
      measurement: conversion.original,
      context: candidateContext(entry.node),
      entry,
      conversionIndex
    })));

    for (let offset = 0; offset < candidates.length; offset += SMART_BATCH_SIZE) {
      const batch = candidates.slice(offset, offset + SMART_BATCH_SIZE);
      let response;
      try {
        response = await platform.sendMessage({
          type: "measuremate:classify",
          candidates: batch.map(({ id, measurement, context }) => ({ id, measurement, context }))
        });
      } catch (error) {
        console.warn("UniMeasure Smart Mode could not reach its provider.", error);
        return;
      }
      if (response?.error) {
        console.warn(`UniMeasure Smart Mode: ${response.error}`);
        return;
      }
      batch.forEach((candidate, index) => {
        if (response?.decisions?.[index]) candidate.entry.accepted.add(candidate.conversionIndex);
      });
    }

    for (const entry of entries) {
      if (entry.node.isConnected && entry.node.nodeValue === entry.text) {
        conversionCount += replaceTextNode(entry.node, entry.accepted);
      }
    }
  }

  async function convertRoot(root) {
    if (!enabled || processing || !root?.isConnected) return;
    processing = true;
    observer?.disconnect();
    try {
      const nodes = collectTextNodes(root);
      if (settings.smartMode) await replaceSmartTextNodes(nodes);
      else for (const node of nodes) conversionCount += replaceTextNode(node);
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
      roots.forEach((candidate) => convertRoot(candidate));
    });
  }

  async function applySettings(nextSettings, forceRebuild = false) {
    settings = sanitizeSettings(nextSettings);
    const nextEnabled = settings.enabledByDefault && !isSiteExcluded(location.hostname, settings.excludedSites);
    const stateChanged = nextEnabled !== enabled;
    enabled = nextEnabled;
    if ((!enabled && stateChanged) || forceRebuild) clearAnnotations();
    if (enabled && settings.conversionMode !== "manual" && (stateChanged || forceRebuild || conversionCount === 0)) {
      await convertRoot(document.body);
    }
  }

  observer = new MutationObserver((mutations) => {
    if (processing || !enabled || settings?.conversionMode === "manual") return;
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
    if (message?.type === "measuremate:manual-convert") {
      showManualResult(message.selectionText || "");
      sendResponse({ shown: true });
      return false;
    }
    return false;
  });

  platform.onSettingsChanged((nextSettings) => applySettings(nextSettings, true));

  platform.getSettings().then((stored) => applySettings(stored));

  function showManualResult(selectionText) {
    document.querySelector(`.${RESULT_CLASS}`)?.remove();
    const conversions = findConversions(selectionText, settings);
    const result = document.createElement("section");
    result.className = RESULT_CLASS;
    result.dataset.measuremateIgnore = "true";
    result.setAttribute("role", "status");

    const heading = document.createElement("strong");
    heading.textContent = "UniMeasure";
    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Close conversion result");
    close.textContent = "×";
    close.addEventListener("click", () => result.remove());
    const header = document.createElement("header");
    header.append(heading, close);
    result.append(header);

    if (!enabled) {
      const message = document.createElement("p");
      message.textContent = "UniMeasure is turned off for this site.";
      result.append(message);
    } else if (conversions.length === 0) {
      const message = document.createElement("p");
      message.textContent = "No supported measurement found in the selection.";
      result.append(message);
    } else {
      const list = document.createElement("ul");
      for (const conversion of conversions) {
        const item = document.createElement("li");
        const original = document.createElement("span");
        original.textContent = conversion.original;
        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "→";
        const converted = document.createElement("b");
        converted.textContent = conversion.converted;
        item.append(original, arrow, converted);
        list.append(item);
      }
      result.append(list);
    }

    document.documentElement.append(result);
    window.setTimeout(() => result.remove(), 12000);
  }
})();
