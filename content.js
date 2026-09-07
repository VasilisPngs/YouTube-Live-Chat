(() => {
  "use strict";

  const TARGET_PATTERN = /\blive|\u03b6\u03c9\u03bd\u03c4\u03b1\u03bd/iu;
  const MENU_SELECTOR = "yt-sort-filter-sub-menu-renderer";
  const TRIGGER_SELECTOR = "#trigger";
  const LABEL_SELECTOR = "#label-text";
  const ITEM_SELECTOR = "tp-yt-paper-item, yt-compact-link-renderer";
  const READY_ATTRIBUTE = "data-live-chat-ready";
  const POLL_INTERVAL_MS = 200;
  const TIMEOUT_MS = 5000;
  const POST_CLICK_DELAY_MS = 300;

  let intervalId = 0;
  let timeoutId = 0;
  let menuOpened = false;
  let itemClicked = false;
  let stopped = false;

  const stop = () => {
    if (stopped) return;

    stopped = true;

    clearInterval(intervalId);
    clearTimeout(timeoutId);
    document.removeEventListener("visibilitychange", onVisibilityChange);

    document.documentElement.setAttribute(READY_ATTRIBUTE, "");
  };

  const matchesTarget = element => TARGET_PATTERN.test(element.textContent);

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

    if (!menuOpened) {
      const trigger = menu.querySelector(TRIGGER_SELECTOR);
      if (!trigger) return;

      menuOpened = true;
      trigger.click();
      return;
    }

    for (const item of document.querySelectorAll(ITEM_SELECTOR)) {
      if (matchesTarget(item)) {
        itemClicked = true;
        item.click();
        item.closest("a")?.click();
        setTimeout(stop, POST_CLICK_DELAY_MS);
        return;
      }
    }
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
    document.addEventListener("visibilitychange", onVisibilityChange);
    guardedRun();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();