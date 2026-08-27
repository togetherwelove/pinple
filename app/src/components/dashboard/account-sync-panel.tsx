"use client";

import { CheckCircle2, Cloud, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { ACCOUNT_SYNC, GOOGLE_AUTH, ROUTES } from "@/lib/config/app";
import type { WorkspaceAccount } from "@/lib/session/workspace-session";
import { createClient } from "@/lib/supabase/client";

const AUTH_ACTIONS = {
  login: "login",
  logout: "logout",
} as const;

type AuthAction = (typeof AUTH_ACTIONS)[keyof typeof AUTH_ACTIONS];

type AccountSyncPanelProps = {
  account: WorkspaceAccount | null;
  hasAuthenticationError: boolean;
};

export function AccountSyncPanel({
  account,
  hasAuthenticationError,
}: AccountSyncPanelProps) {
  const [activeAction, setActiveAction] = useState<AuthAction | null>(null);
  const [errorMessage, setErrorMessage] = useState(
    hasAuthenticationError ? ACCOUNT_SYNC.loginError : "",
  );

  async function loginWithGoogle() {
    setActiveAction(AUTH_ACTIONS.login);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      options: {
        queryParams: {
          prompt: GOOGLE_AUTH.accountSelectionPrompt,
        },
        redirectTo: new URL(
          ROUTES.authCallback,
          window.location.origin,
        ).toString(),
      },
      provider: GOOGLE_AUTH.provider,
    });

    if (error) {
      setErrorMessage(ACCOUNT_SYNC.loginError);
      setActiveAction(null);
    }
  }

  async function logout() {
    setActiveAction(AUTH_ACTIONS.logout);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(ACCOUNT_SYNC.logoutError);
      setActiveAction(null);
      return;
    }

    window.location.assign(ROUTES.rosters);
  }

  if (account) {
    const accountLabel = account.name ?? account.email;

    return (
      <section className="border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--ink)]" size={19} />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{ACCOUNT_SYNC.connectedTitle}</h2>
            {accountLabel ? (
              <p className="mt-1 truncate text-sm font-medium">{accountLabel}</p>
            ) : null}
            <p className="mt-1 text-sm text-[var(--muted)]">
              {ACCOUNT_SYNC.connectedDescription}
            </p>
          </div>
        </div>
        <button
          aria-busy={activeAction === AUTH_ACTIONS.logout}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium hover:bg-[var(--canvas)] disabled:cursor-wait disabled:opacity-70"
          disabled={activeAction !== null}
          onClick={() => void logout()}
          type="button"
        >
          {activeAction === AUTH_ACTIONS.logout ? (
            <Spinner size="sm" />
          ) : (
            <LogOut size={16} />
          )}
          {ACCOUNT_SYNC.logout}
        </button>
        {errorMessage ? (
          <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="border border-[var(--ink)] bg-[var(--surface)] p-4">
      <div className="flex items-start gap-3">
        <Cloud className="mt-0.5 shrink-0 text-[var(--ink)]" size={20} />
        <div>
          <h2 className="font-semibold">{ACCOUNT_SYNC.loginTitle}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {ACCOUNT_SYNC.loginDescription}
          </p>
        </div>
      </div>
      <button
        aria-busy={activeAction === AUTH_ACTIONS.login}
        className="mt-3 flex w-full items-center justify-center gap-2 bg-[var(--ink)] px-3 py-2.5 text-sm font-semibold text-[var(--surface)] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        disabled={activeAction !== null}
        onClick={() => void loginWithGoogle()}
        type="button"
      >
        {activeAction === AUTH_ACTIONS.login ? (
          <Spinner size="sm" />
        ) : (
          <LogIn size={17} />
        )}
        {ACCOUNT_SYNC.googleLogin}
      </button>
      {errorMessage ? (
        <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
