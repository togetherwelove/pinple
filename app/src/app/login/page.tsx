"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signIn() {
    await createClient().auth.signInWithOAuth({ options: { redirectTo: `${window.location.origin}/auth/callback` }, provider: "google" });
  }
  return <main className="flex min-h-screen items-center justify-center"><button onClick={signIn} type="button">Google로 로그인</button></main>;
}
