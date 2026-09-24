(() => {
  "use strict";

  const TARGET_PATTERN = /\blive|\u03b6\u03c9\u03bd\u03c4\u03b1\u03bd/iu;
  const MENU_SELECTOR = "yt-sort-filter-sub-menu-renderer";
  const TRIGGER_SELECTOR = "#trigger";
  const LABEL_SELECTOR = "#label-text";
  const ITEM_SELECTOR = "tp-yt-paper-item, yt-compact-link-renderer";
  const READY_ATTRIBUTE = "data-live-chat-ready";
  const POLL_INTERVAL_MS = 200;
  const OPEN_INTERVAL_MS = 1000;
  const TIMEOUT_MS = 5000;
  const POST_CLICK_DELAY_MS = 300;

  const controller = new AbortController();

  let intervalId = 0;
  let timeoutId = 0;
  let lastOpenTime = -Infinity;
  let itemClicked = false;
  let stopped = false;

  const stop = () => {
    if (stopped) return;

    stopped = true;

    clearInterval(intervalId);
    clearTimeout(timeoutId);
    controller.abort();

    document.documentElement.setAttribute(READY_ATTRIBUTE, "");
  };

  const matchesTarget = element => TARGET_PATTERN.test(element.textContent);

  const collectOpenItems = (menu) => {
    const items = [];

    for (const item of menu.querySelectorAll(ITEM_SELECTOR)) {
      if (item.getClientRects().length > 0) items.push(item);
    }

    return items;
  };

  const run = () => {
    if (stopped) return;

    const menu = document.querySelector(MENU_SELECTOR);
    if (!menu) return;

    const label = menu.querySelector(LABEL_SELECTOR);
    if (label && matchesTarget(label)) {
      stop();
      return;
    }

    if (itemClicked) return;

    const items = collectOpenItems(menu);

    for (const item of items) {
      if (!matchesTarget(item)) continue;

      itemClicked = true;
      (item.closest("a") || item).click();
      setTimeout(stop, POST_CLICK_DELAY_MS);
      return;
    }

    if (items.length > 0) return;

    const now = performance.now();

    if (now - lastOpenTime < OPEN_INTERVAL_MS) return;

    const trigger = menu.querySelector(TRIGGER_SELECTOR);
    if (!trigger) return;

    lastOpenTime = now;
    trigger.click();
  };

  const guardedRun = () => {
    try {
      run();
    } catch {
      stop();
    }
  };

  const onVisibilityChange = () => {
    if (document.hidden) return;
    guardedRun();
  };

  const init = () => {
    timeoutId = setTimeout(stop, TIMEOUT_MS);
    intervalId = setInterval(guardedRun, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange, { signal: controller.signal });
    guardedRun();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();