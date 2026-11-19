/**
 * Only allow same-app relative paths as post-login redirect targets.
 * Prevents open redirects like /login?next=https://evil.example or //evil.example.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.startsWith("/login")) return fallback;
  return next;
}
