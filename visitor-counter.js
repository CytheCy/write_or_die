(function () {
  const COUNTER_BASE_URL = "https://api.counterapi.dev/v1/writing-dash/visitors";
  const PAGE_KEY = document.body?.dataset.page || "unknown";
  const COUNTER_SELECTOR = "[data-visitor-count]";
  const VISIT_KEY = "writing-dash-visitor-counted";
  const REFRESH_INTERVAL_MS = 30000;

  function formatCount(value) {
    const numericValue = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("en-US", {
      minimumIntegerDigits: 6,
      useGrouping: false,
    }).format(numericValue);
  }

  function setCounterDisplay(value) {
    document.querySelectorAll(COUNTER_SELECTOR).forEach((node) => {
      node.textContent = formatCount(value);
    });
  }

  async function fetchCounter() {
    const response = await fetch(`${COUNTER_BASE_URL}/?t=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Counter request failed with ${response.status}`);
    }

    const payload = await response.json();
    const value = payload?.count ?? payload?.value ?? payload?.data?.count ?? payload?.data?.value ?? 0;
    return Number(value) || 0;
  }

  function hasCountedVisit() {
    try {
      return localStorage.getItem(VISIT_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function markVisitCounted() {
    try {
      localStorage.setItem(VISIT_KEY, "1");
    } catch (error) {
      // Ignore storage failures and fall back to counting the visit.
    }
  }

  function clearVisitCounted() {
    try {
      localStorage.removeItem(VISIT_KEY);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  async function incrementCounter() {
    if (hasCountedVisit()) {
      return;
    }

    markVisitCounted();

    const response = await fetch(`${COUNTER_BASE_URL}/up?t=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      clearVisitCounted();
      throw new Error(`Counter increment failed with ${response.status}`);
    }
  }

  async function refreshCounter() {
    try {
      const value = await fetchCounter();
      setCounterDisplay(value);
    } catch (error) {
      console.error(error);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (PAGE_KEY === "index") {
      try {
        await incrementCounter();
      } catch (error) {
        console.error(error);
      }
    }

    await refreshCounter();

    if (PAGE_KEY === "about") {
      window.setInterval(refreshCounter, REFRESH_INTERVAL_MS);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          refreshCounter();
        }
      });
    }
  });
})();
