import { NextResponse, type NextRequest } from "next/server";
import {
  ANONYMOUS_SESSION_COOKIE,
  ANONYMOUS_SESSION_MAX_AGE_SECONDS,
  isAnonymousSessionId,
} from "@/lib/session/config";

export function proxy(request: NextRequest) {
  const currentSessionId = request.cookies.get(ANONYMOUS_SESSION_COOKIE)?.value;

  if (isAnonymousSessionId(currentSessionId)) {
    return NextResponse.next();
  }

  const sessionId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  const currentCookieHeader = requestHeaders.get("cookie");
  const sessionCookie = `${ANONYMOUS_SESSION_COOKIE}=${sessionId}`;

  requestHeaders.set(
    "cookie",
    currentCookieHeader ? `${currentCookieHeader}; ${sessionCookie}` : sessionCookie,
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(ANONYMOUS_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: ANONYMOUS_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
