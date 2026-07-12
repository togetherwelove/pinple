"use client";

import { UI_LABELS, UI_MESSAGES } from "@/lib/config/app";

type LeaderConflictDialogProps = {
  onReplaceTargetLeader: () => void;
  onRetainTargetLeader: () => void;
};

export function LeaderConflictDialog({
  onReplaceTargetLeader,
  onRetainTargetLeader,
}: LeaderConflictDialogProps) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
    >
      <section className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        <h2 className="font-semibold">{UI_LABELS.leader} 지정 선택</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{UI_MESSAGES.leaderConflict}</p>
        <div className="mt-5 grid gap-2">
          <button
            className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
            onClick={onRetainTargetLeader}
            type="button"
          >
            {UI_LABELS.retainExistingLeader}
          </button>
          <button
            className="bg-[var(--ink)] px-3 py-2 text-sm text-white hover:opacity-90"
            onClick={onReplaceTargetLeader}
            type="button"
          >
            {UI_LABELS.assignMovingLeader}
          </button>
        </div>
      </section>
    </div>
  );
}
