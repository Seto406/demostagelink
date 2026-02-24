import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// 🔥 THE FIX: Catch Stale Chunk Errors from backgrounded tabs or new deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Stale cache or new version detected. Forcing a clean reload...');
  event.preventDefault(); // Prevent the red error overlay
  window.location.reload(); // Force the browser to grab the brand new files
});

// Catch Hydration Mismatches (e.g. AdSense injection or Google Translate)
window.addEventListener('error', (event) => {
  if (event.message?.includes('Minified React error #418') || event.message?.includes('Hydration failed')) {
    const lastReload = sessionStorage.getItem('hydration_reload');
    const now = Date.now();

    // Prevent infinite loops: only reload if last reload was > 10 seconds ago
    if (lastReload && now - parseInt(lastReload) < 10000) {
      console.error('Hydration mismatch detected, but reload loop prevented.');
      return;
    }

    console.warn('Hydration mismatch detected. Reloading...');
    sessionStorage.setItem('hydration_reload', now.toString());
    event.preventDefault();
    window.location.reload();
  }
});

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HelmetProvider>
);
