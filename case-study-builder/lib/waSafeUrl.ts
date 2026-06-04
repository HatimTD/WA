/**
 * Returns `url` only when it is a safe http(s) or same-origin relative URL;
 * otherwise returns undefined. Neutralises stored `javascript:` / `data:` /
 * `vbscript:` URIs that would execute if placed in an <a href> and clicked.
 *
 * Use for any attachment link whose target comes from stored data
 * (image URLs, document URLs). A relative URL (e.g. the /api/documents/download
 * proxy) resolves to https against the dummy base and is allowed through.
 */
export function waSafeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, 'https://internal.invalid');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}
