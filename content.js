(() => {
    const TARGET_PATTERN = /\blive\b|\u03b6\u03c9\u03bd\u03c4\u03b1\u03bd/iu;
    const MENU_SELECTOR = "yt-sort-filter-sub-menu-renderer";
    const TRIGGER_SELECTOR = "#trigger";
    const LABEL_SELECTOR = "#label-text";
    const ITEM_SELECTOR = "tp-yt-paper-item, yt-compact-link-renderer";
    const CHECK_INTERVAL_MS = 250;
    const OPEN_INTERVAL_MS = 500;
    const MAX_RUNTIME_MS = 10000;

    let menu = null;
    let trigger = null;
    let intervalId = null;
    let timeoutId = null;
    let lastOpenTime = 0;
    let stopped = false;

    const stop = () => {
        if (stopped) return;

        stopped = true;

        clearInterval(intervalId);
        clearTimeout(timeoutId);
    };

    const matchesTarget = element => {
        return element instanceof Element && TARGET_PATTERN.test(element.textContent || "");
    };

    const isVisible = element => {
        return element instanceof Element && element.getClientRects().length > 0;
    };

    const getMenu = () => {
        if (menu?.isConnected) return menu;

        trigger = null;
        menu = document.querySelector(MENU_SELECTOR);

        return menu;
    };

    const getTrigger = currentMenu => {
        if (trigger?.isConnected) return trigger;

        const candidate = currentMenu.querySelector(TRIGGER_SELECTOR);
        trigger = candidate instanceof HTMLElement ? candidate : null;

        return trigger;
    };

    const getTargetItem = () => {
        const items = document.querySelectorAll(ITEM_SELECTOR);

        for (const item of items) {
            if (isVisible(item) && matchesTarget(item)) return item;
        }

        return null;
    };

    const run = () => {
        if (stopped) return;

        const currentMenu = getMenu();
        if (!currentMenu) return;

        const currentTrigger = getTrigger(currentMenu);
        if (!currentTrigger) return;

        if (matchesTarget(currentMenu.querySelector(LABEL_SELECTOR))) {
            stop();
            return;
        }

        const targetItem = getTargetItem();

        if (targetItem instanceof HTMLElement) {
            targetItem.click();
            stop();
            return;
        }

        const now = performance.now();

        if (now - lastOpenTime >= OPEN_INTERVAL_MS) {
            lastOpenTime = now;
            currentTrigger.click();
        }
    };

    intervalId = setInterval(run, CHECK_INTERVAL_MS);
    timeoutId = setTimeout(stop, MAX_RUNTIME_MS);

    run();
})();
