(() => {
  "use strict";

  const TARGET_PATTERN = /\blive|\u03b6\u03c9\u03bd\u03c4\u03b1\u03bd/iu;
  const MENU_SELECTOR = "yt-sort-filter-sub-menu-renderer";
  const SCOPE_SELECTOR = "yt-sort-filter-sub-menu-renderer, tp-yt-iron-dropdown";
  const TRIGGER_SELECTOR = "#trigger";
  const LABEL_SELECTOR = "#label-text";
  const ITEM_SELECTOR = "tp-yt-paper-item, yt-compact-link-renderer";
  const READY_ATTRIBUTE = "data-live-chat-ready";
  const CHECK_INTERVAL_MS = 250;
  const OPEN_INTERVAL_MS = 1200;
  const MENU_DEADLINE_MS = 3000;
  const MAX_RUNTIME_MS = 12000;
  const ABANDON_AFTER_MS = 300000;

  let menu = null;
  let trigger = null;
  let intervalId = 0;
  let abandonId = 0;
  let lastOpenTime = -Infinity;
  let selected = false;
  let stopped = false;
  let readyMark = null;
  let visibleSince = document.hidden ? 0 : performance.now();
  let visibleAccum = 0;

  const visibleMs = () => visibleAccum + (visibleSince ? performance.now() - visibleSince : 0);

  const onVisibilityChange = () => {
    if (document.hidden) {
      if (visibleSince) {
        visibleAccum += performance.now() - visibleSince;
        visibleSince = 0;
      }
      return;
    }

    visibleSince ||= performance.now();
    guardedRun();
  };

  const stop = () => {
    if (stopped) return;

    stopped = true;

    clearInterval(intervalId);
    clearTimeout(abandonId);
    document.removeEventListener("visibilitychange", onVisibilityChange);

    document.documentElement.setAttribute(READY_ATTRIBUTE, "");
  };

  const matchesTarget = element => TARGET_PATTERN.test(element.textContent);

  const isVisible = element => element.getClientRects().length > 0;

  const getMenu = () => {
    if (menu?.isConnected) return menu;

    trigger = null;
    menu = document.querySelector(MENU_SELECTOR);

    return menu;
  };

  const getTrigger = currentMenu => {
    if (trigger?.isConnected) return trigger;

    trigger = currentMenu.querySelector(TRIGGER_SELECTOR);

    return trigger;
  };

  const scanItems = () => {
    let open = false;

    for (const scope of document.querySelectorAll(SCOPE_SELECTOR)) {
      for (const item of scope.querySelectorAll(ITEM_SELECTOR)) {
        if (!isVisible(item)) continue;
        if (matchesTarget(item)) return { open: true, match: item };

        open = true;
      }
    }

    return { open, match: null };
  };

  const run = () => {
    if (stopped || document.hidden) return;

    if (visibleMs() >= MAX_RUNTIME_MS) {
      stop();
      return;
    }

    const currentMenu = getMenu();

    if (!currentMenu) {
      if (document.readyState === "loading") return;

      readyMark ??= visibleMs();

      if (visibleMs() - readyMark >= MENU_DEADLINE_MS) stop();
      return;
    }

    const label = currentMenu.querySelector(LABEL_SELECTOR);

    if (label && matchesTarget(label)) {
      stop();
      return;
    }

    if (selected) return;

    const { open, match } = scanItems();

    if (match) {
      selected = true;
      match.click();
      return;
    }

    if (open) return;

    const now = performance.now();

    if (now - lastOpenTime < OPEN_INTERVAL_MS) return;

    const currentTrigger = getTrigger(currentMenu);

    if (!currentTrigger) return;

    lastOpenTime = now;
    currentTrigger.click();
  };

  const guardedRun = () => {
    try {
      run();
    } catch {
      stop();
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);

  abandonId = setTimeout(stop, ABANDON_AFTER_MS);
  intervalId = setInterval(guardedRun, CHECK_INTERVAL_MS);
})();
