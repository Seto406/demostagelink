export const cleanupStorage = () => {
  const LAST_CLEANUP_KEY = 'last_cleanup';
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  try {
    const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
    const now = Date.now();

    if (lastCleanup && now - parseInt(lastCleanup, 10) < MAX_AGE) {
      return;
    }

    // Allowlist: Specific keys that should be preserved
    const allowlist = [
      'app_version',
      LAST_CLEANUP_KEY,
      'vite-ui-theme',
      'pendingUserRole',
    ];

    // Prefix allowlist: Keys starting with these prefixes should be preserved
    const prefixAllowlist = ['sb-', 'stagelink_'];

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isAllowed = allowlist.includes(key) || prefixAllowlist.some(prefix => key.startsWith(prefix));

      if (!isAllowed) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(LAST_CLEANUP_KEY, now.toString());

    if (keysToRemove.length > 0) {
      console.log(`[Storage Cleanup] Removed ${keysToRemove.length} stale keys:`, keysToRemove);
    }
  } catch (error) {
    console.error('[Storage Cleanup] Error during cleanup:', error);
  }
};

export const performNuclearWipe = () => {
  console.warn("Executing Nuclear Refresh Protocol.");

  // 1. Clear Storage
  localStorage.clear();
  sessionStorage.clear();

  // 2. Clear Cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // 3. Clear Caches (if supported)
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  // 4. Unregister Service Workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }

  // 5. Reload with cache busting
  window.location.href = window.location.origin + '?cache-bust=' + Date.now();
};
