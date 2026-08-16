import { formatCopyrightNotice } from "@/lib/config/app";

export function CopyrightFooter() {
  return (
    <footer className="shrink-0 bg-[var(--canvas)] px-4 py-1.5 text-center text-xs text-[var(--muted)]">
      {formatCopyrightNotice(new Date().getFullYear())}
    </footer>
  );
}
