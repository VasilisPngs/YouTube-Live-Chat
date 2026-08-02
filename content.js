(() => {
    const TARGET_PATTERN = /\blive|\u03b6\u03c9\u03bd\u03c4\u03b1\u03bd/iu;
    const MENU_SELECTOR = "yt-sort-filter-sub-menu-renderer";
    const SCOPE_SELECTOR = "yt-sort-filter-sub-menu-renderer, tp-yt-iron-dropdown";
    const TRIGGER_SELECTOR = "#trigger";
    const LABEL_SELECTOR = "#label-text";
    const ITEM_SELECTOR = "tp-yt-paper-item, yt-compact-link-renderer";
    const READY_ATTRIBUTE = "data-live-chat-ready";
    const CHECK_INTERVAL_MS = 250;
    const OPEN_INTERVAL_MS = 500;
    const MENU_DEADLINE_MS = 3000;
    const MAX_RUNTIME_MS = 10000;

    const startTime = performance.now();

    let menu = null;
    let trigger = null;
    let observer = null;
    let intervalId = 0;
    let timeoutId = 0;
    let frameId = 0;
    let lastOpenTime = -Infinity;
    let selected = false;
    let stopped = false;

    const releaseObserver = () => {
        if (!observer) return;

        observer.disconnect();
        observer = null;

        cancelAnimationFrame(frameId);
        frameId = 0;
    };

    const stop = () => {
        if (stopped) return;

        stopped = true;

        releaseObserver();
        clearInterval(intervalId);
        clearTimeout(timeoutId);

        document.documentElement.setAttribute(READY_ATTRIBUTE, "");
    };

    timeoutId = setTimeout(stop, MAX_RUNTIME_MS);

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
        if (stopped) return;

        const currentMenu = getMenu();

        if (!currentMenu) {
            if (performance.now() - startTime >= MENU_DEADLINE_MS) stop();
            return;
        }

        releaseObserver();

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

    const scheduleRun = () => {
        if (stopped || frameId) return;

        frameId = requestAnimationFrame(() => {
            frameId = 0;
            run();
        });
    };

    observer = new MutationObserver(scheduleRun);
    observer.observe(document, { childList: true, subtree: true });

    intervalId = setInterval(run, CHECK_INTERVAL_MS);
})();
