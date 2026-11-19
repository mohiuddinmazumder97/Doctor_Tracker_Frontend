import { NextResponse, type NextRequest } from "next/server";

/** Must match the backend's cookie name (backend/src/utils/cookies.ts). */
const AUTH_COOKIE = "dt_access_token";
const PUBLIC_PATHS = ["/login"];

/**
 * Optimistic route guard. It only checks that the session cookie EXISTS so unauthenticated
 * users are redirected before any protected page renders (no flash of content).
 *
 * It deliberately does not verify the JWT: the secret lives only on the backend, which
 * verifies the token on every API call. An invalid cookie therefore yields 401s from the
 * API, the backend clears the cookie, and the client redirects to /login.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip API calls (proxied to the backend), Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
