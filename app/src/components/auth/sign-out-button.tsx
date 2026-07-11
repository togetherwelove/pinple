"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES, UI_LABELS, UI_MESSAGES } from "@/lib/config/app";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setErrorMessage(null);
    setIsSigningOut(true);

    const { error } = await createClient().auth.signOut();

    if (error) {
      setErrorMessage(UI_MESSAGES.signOutFailed);
      setIsSigningOut(false);
      return;
    }

    router.replace(ROUTES.login);
    router.refresh();
  }

  return (
    <div className={className}>
      <button
        className="flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--canvas)] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSigningOut}
        onClick={() => void signOut()}
        type="button"
      >
        <LogOut size={16} />
        {isSigningOut ? UI_MESSAGES.signingOut : UI_LABELS.signOut}
      </button>
      {errorMessage ? <p className="mt-2 text-xs text-red-700" role="alert">{errorMessage}</p> : null}
    </div>
  );
}
