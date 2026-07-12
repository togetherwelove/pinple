"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { LOGIN_CONTENT, UI_MESSAGES } from "@/lib/config/app";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signIn() {
    setErrorMessage(null);
    setIsSigningIn(true);

    const { error } = await createClient().auth.signInWithOAuth({
      options: { redirectTo: `${window.location.origin}/auth/callback` },
      provider: "google",
    });

    if (error) {
      setErrorMessage(UI_MESSAGES.signInFailed);
      setIsSigningIn(false);
    }
  }

  return (
    <div>
      <button
        className="flex w-full items-center justify-center gap-3 bg-[var(--ink)] px-5 py-3 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSigningIn}
        onClick={() => void signIn()}
        type="button"
      >
        {isSigningIn ? <Spinner size="sm" /> : <LogIn size={17} />}
        {isSigningIn ? UI_MESSAGES.signingIn : LOGIN_CONTENT.googleContinue}
      </button>
      {errorMessage ? <p className="mt-3 text-sm text-red-700" role="alert">{errorMessage}</p> : null}
    </div>
  );
}
