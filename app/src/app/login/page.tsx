import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LoginPreview } from "@/components/auth/login-preview";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { APP_NAME, LOGIN_CONTENT, ROUTES } from "@/lib/config/app";

export default async function LoginPage() {
  const user = await requireCurrentUser().catch(() => null);

  if (user) {
    redirect(ROUTES.rosters);
  }

  return (
    <main className="grid min-h-screen bg-[var(--surface)] lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
      <section className="order-2 border-t border-[var(--border)] bg-[var(--canvas)] p-5 sm:p-8 lg:order-1 lg:border-t-0 lg:border-r lg:p-10 xl:p-14">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold text-[var(--ink)]">{APP_NAME}</p>
          <div className="mt-8">
            <LoginPreview />
          </div>
        </div>
      </section>
      <section className="order-1 flex items-center px-5 py-14 sm:px-10 lg:order-2 lg:px-14 xl:px-20">
        <div className="w-full max-w-sm">
          <p className="text-sm font-semibold text-[var(--ink)]">{APP_NAME}</p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight text-[var(--ink)]">
            {LOGIN_CONTENT.title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            {LOGIN_CONTENT.description}
          </p>
          <div className="mt-8">
            <GoogleSignInButton />
          </div>
        </div>
      </section>
    </main>
  );
}
