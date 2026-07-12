import { Spinner } from "@/components/spinner";
import { UI_LABELS } from "@/lib/config/app";

const SKELETON_ROWS = 4;

export default function RosterLoading() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-7 w-40 bg-[var(--border)]" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="min-h-80 border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="h-5 w-24 bg-[var(--border)]" />
            <div className="mt-3 h-48 bg-[var(--canvas)]" />
            <div className="mt-3 h-10 bg-[var(--border)]" />
          </section>
          <section className="min-h-80 border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Spinner size="sm" />
              {UI_LABELS.dashboardLoading}
            </div>
            <div className="mt-4 space-y-2">
              {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <div className="h-12 bg-[var(--canvas)]" key={index} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
