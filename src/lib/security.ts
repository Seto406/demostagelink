const SAFE_HTTP_PROTOCOLS = new Set(["http:", "https:"]);

const MAP_EMBED_ALLOWED_HOSTS = new Set([
  "www.google.com",
  "maps.google.com",
  "www.openstreetmap.org",
  "www.bing.com",
]);

const MAP_EMBED_ALLOWED_PATH_PREFIXES = ["/maps/embed", "/maps", "/export/embed.html"];

const TRAILER_ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
]);

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

export const toSafeTrailerUrl = (value: string | null | undefined): string | null => {
  const safeUrl = toSafeExternalUrl(value);
  if (!safeUrl) return null;

  const parsed = new URL(safeUrl);
  return TRAILER_ALLOWED_HOSTS.has(parsed.hostname) ? safeUrl : null;
};

export const toTrailerEmbedUrl = (value: string | null | undefined): string | null => {
  const safeUrl = toSafeTrailerUrl(value);
  if (!safeUrl) return null;

  const parsed = new URL(safeUrl);
  const host = parsed.hostname.toLowerCase();

  if (host === "youtu.be") {
    const videoId = parsed.pathname.replace("/", "").trim();
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host.includes("youtube.com")) {
    if (parsed.pathname.startsWith("/embed/")) return safeUrl;
    const videoId = parsed.searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host.includes("vimeo.com")) {
    if (host === "player.vimeo.com") return safeUrl;
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const videoId = pathParts[pathParts.length - 1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  return null;
};
