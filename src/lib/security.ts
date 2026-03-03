const SAFE_HTTP_PROTOCOLS = new Set(["http:", "https:"]);

const MAP_EMBED_ALLOWED_HOSTS = new Set([
  "www.google.com",
  "maps.google.com",
  "www.openstreetmap.org",
  "www.bing.com",
]);

const MAP_EMBED_ALLOWED_PATH_PREFIXES = ["/maps/embed", "/maps", "/export/embed.html"];

const cleanInput = (input: string) => input.trim().replace(/&amp;/g, "&");

export const toSafeExternalUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;

  try {
    const parsedUrl = new URL(cleanInput(value));
    if (!SAFE_HTTP_PROTOCOLS.has(parsedUrl.protocol)) return null;
    return parsedUrl.toString();
  } catch {
    return null;
  }
};

export const parseMapEmbedSrc = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const input = cleanInput(value);

  if (!input.toLowerCase().startsWith("<iframe")) {
    return null;
  }

  const srcMatch = input.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
  const candidateSrc = srcMatch?.[1];
  if (!candidateSrc) return null;

  const safeSrc = toSafeExternalUrl(candidateSrc);
  if (!safeSrc) return null;

  const parsedSrc = new URL(safeSrc);
  const isAllowedHost = MAP_EMBED_ALLOWED_HOSTS.has(parsedSrc.hostname);
  const isAllowedPath = MAP_EMBED_ALLOWED_PATH_PREFIXES.some((prefix) =>
    parsedSrc.pathname.startsWith(prefix),
  );

  return isAllowedHost && isAllowedPath ? safeSrc : null;
};
