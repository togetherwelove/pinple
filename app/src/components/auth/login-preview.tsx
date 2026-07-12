import { CheckCircle2, GripVertical, UsersRound } from "lucide-react";
import {
  LOGIN_CONTENT,
  LOGIN_PREVIEW_GROUPS,
} from "@/lib/config/app";

export function LoginPreview() {
  return (
    <section className="overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="grid min-h-112 grid-cols-[128px_1fr] sm:grid-cols-[160px_1fr]">
        <aside className="border-r border-[var(--border)] bg-[var(--canvas)] p-3 sm:p-4">
          <p className="text-xs font-semibold text-[var(--ink)]">{LOGIN_CONTENT.previewRosterLabel}</p>
          <div className="mt-4 border border-dashed border-[var(--border)] px-2 py-2 text-xs text-[var(--muted)]">
            + {LOGIN_CONTENT.previewNewRoster}
          </div>
          <div className="mt-3 bg-[var(--surface)] px-2 py-2 text-xs font-medium">
            {LOGIN_CONTENT.previewTitle}
          </div>
        </aside>
        <div className="min-w-0 p-4 sm:p-6">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div>
              <p className="text-xs text-[var(--muted)]">
                {LOGIN_CONTENT.previewRosterHeading}
              </p>
              <h2 className="mt-1 text-base font-semibold text-[var(--ink)]">
                {LOGIN_CONTENT.previewTitle}
              </h2>
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 size={14} />
              {LOGIN_CONTENT.previewStatus}
            </span>
          </header>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
            <UsersRound size={14} />
            {LOGIN_CONTENT.previewTotal}
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {LOGIN_PREVIEW_GROUPS.map((group) => (
              <section className="border border-[var(--border)]" key={group.name}>
                <header className="border-b border-[var(--border)] px-3 py-2 text-sm font-medium">
                  {group.name}
                </header>
                <ul>
                  {group.members.map((member) => (
                    <li className="flex items-center gap-1 border-b border-[var(--border)] px-3 py-2 text-xs last:border-b-0" key={member}>
                      <GripVertical size={12} className="text-[var(--muted)]" />
                      {member}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
            {LOGIN_CONTENT.previewDescription}
          </p>
        </div>
      </div>
    </section>
  );
}
