/**
 * Helpers for the `?redirect=` round trip between the auth pages and the
 * page the visitor came from.
 *
 * The value arrives from the URL, so it is untrusted: `router.push()` happily
 * accepts an absolute URL and would send the user to another site after
 * signing in. `safeRedirect` therefore only ever returns a same-origin path.
 */

/**
 * Returns `raw` when it is a safe same-origin path, otherwise `fallback`.
 *
 * Rejected: absolute URLs (`https://evil.example`), protocol-relative URLs
 * (`//evil.example`), backslash tricks (`/\evil.example`) and anything that
 * is not rooted at a single `/`.
 */
export function safeRedirect(
  raw: string | null | undefined,
  fallback = '/account',
): string {
  if (!raw) return fallback;

  const value = raw.trim();
  if (!value.startsWith('/')) return fallback;
  // `//host` and `/\host` are both treated as protocol-relative by browsers.
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;

  return value;
}

/** Builds the login URL that returns the visitor to `path` after signing in. */
export function loginUrlFor(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}

/** Builds the registration URL that returns the visitor to `path` after signing up. */
export function registerUrlFor(path: string): string {
  return `/register?redirect=${encodeURIComponent(path)}`;
}
