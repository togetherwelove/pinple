import { type NextRequest, NextResponse } from "next/server";
import { AUTH_QUERY, ROUTES } from "@/lib/config/app";
import { createClient } from "@/lib/supabase/server";

const AUTHORIZATION_CODE_PARAMETER = "code";

export async function GET(request: NextRequest) {
  const redirectUrl = new URL(ROUTES.rosters, request.url);
  const authorizationCode = request.nextUrl.searchParams.get(
    AUTHORIZATION_CODE_PARAMETER,
  );

  if (authorizationCode) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      authorizationCode,
    );

    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  redirectUrl.searchParams.set(
    AUTH_QUERY.errorParameter,
    AUTH_QUERY.errorValue,
  );

  return NextResponse.redirect(redirectUrl);
}
