import { useEffect } from 'react';
import { cleanupStorage } from '@/lib/cleanupStorage';
import { toast } from "sonner";

export const SystemStability = () => {
  useEffect(() => {
    // Run storage cleanup on mount
    cleanupStorage();

    // Version Check
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json', { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data.version;
        const localVersion = localStorage.getItem('app_version');

        if (serverVersion && localVersion && serverVersion !== localVersion) {
          console.log('[System Stability] New version detected:', serverVersion);

          // Update version in storage
          localStorage.setItem('app_version', serverVersion);

          // Clear caches to ensure fresh assets
          if ('caches' in window) {
            try {
               const keys = await caches.keys();
               await Promise.all(keys.map(key => caches.delete(key)));
               console.log('[System Stability] Cleared caches');
            } catch (e) {
               console.warn('[System Stability] Failed to clear caches:', e);
            }
          }

          // Show Toast and delay reload
          toast.success("Update available!", {
            description: "Refreshing the page in 3 seconds to apply the latest features...",
          });

          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else if (!localVersion && serverVersion) {
           // First time load or version not set, just set it
           localStorage.setItem('app_version', serverVersion);
        }
      } catch (error) {
        console.error('[System Stability] Version check failed:', error);
      }
    };

    checkVersion();
  }, []);

  return null;
};
