import type { NextRequest } from "next/server";
import {
  ANONYMOUS_SESSION_COOKIE,
  ANONYMOUS_SESSION_MAX_AGE_SECONDS,
  isAnonymousSessionId,
} from "@/lib/session/config";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const currentSessionId = request.cookies.get(ANONYMOUS_SESSION_COOKIE)?.value;
  let createdSessionId: string | null = null;

  if (!isAnonymousSessionId(currentSessionId)) {
    createdSessionId = crypto.randomUUID();
    request.cookies.set(ANONYMOUS_SESSION_COOKIE, createdSessionId);
  }

  const response = await updateSupabaseSession(request);

  if (!createdSessionId) {
    return response;
  }

  response.cookies.set(ANONYMOUS_SESSION_COOKIE, createdSessionId, {
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
