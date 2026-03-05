const DEFAULT_ADSENSE_CLIENT = "ca-pub-4021944125309456";

const env = import.meta.env;

export const ADSENSE_CLIENT = env.VITE_ADSENSE_CLIENT || DEFAULT_ADSENSE_CLIENT;

export const AD_SLOTS = {
  feedHorizontal: env.VITE_ADSENSE_SLOT_FEED_HORIZONTAL,
  showsHorizontal: env.VITE_ADSENSE_SLOT_SHOWS_HORIZONTAL,
  showDetailsBox: env.VITE_ADSENSE_SLOT_SHOW_DETAILS_BOX,
  externalRedirectBox: env.VITE_ADSENSE_SLOT_EXTERNAL_REDIRECT_BOX,
  footerHorizontal: env.VITE_ADSENSE_SLOT_FOOTER_HORIZONTAL,
} as const;

export const isAdsenseSlotConfigured = (slot?: string | null): slot is string =>
  Boolean(ADSENSE_CLIENT && slot && slot.trim().length > 0);
