import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

interface UseDraftStorageOptions<T> {
  modalName: string;
  userId?: string | null;
  isOpen: boolean;
  draft: T;
  onHydrate: (draft: T) => void;
  debounceMs?: number;
}

export const useDraftStorage = <T,>({
  modalName,
  userId,
  isOpen,
  draft,
  onHydrate,
  debounceMs = 200,
}: UseDraftStorageOptions<T>) => {
  const location = useLocation();
  const hydratedRef = useRef(false);
  const [didRestoreDraft, setDidRestoreDraft] = useState(false);

  const storageKey = useMemo(
    () => `draft:${location.pathname}:${modalName}:${userId ?? "anonymous"}`,
    [location.pathname, modalName, userId],
  );

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!isOpen) {
      hydratedRef.current = false;
      setDidRestoreDraft(false);
      return;
    }

    if (typeof window === "undefined" || hydratedRef.current) return;

    const saved = sessionStorage.getItem(storageKey);
    hydratedRef.current = true;

    if (!saved) return;

    try {
      onHydrate(JSON.parse(saved) as T);
      setDidRestoreDraft(true);
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [isOpen, onHydrate, storageKey]);

  useEffect(() => {
    if (!isOpen || !hydratedRef.current || typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [draft, debounceMs, isOpen, storageKey]);

  return {
    didRestoreDraft,
    clearDraft,
  };
};
