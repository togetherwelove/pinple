"use client";

import { ROSTER_BOARD, UI_LABELS, UI_MESSAGES } from "@/lib/config/app";

type RegroupConfirmationDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function RegroupConfirmationDialog({
  onCancel,
  onConfirm,
}: RegroupConfirmationDialogProps) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
    >
      <section className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        <h2 className="font-semibold">{ROSTER_BOARD.regroupTitle}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {UI_MESSAGES.regroupConfirmation}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
            onClick={onCancel}
            type="button"
          >
            {UI_LABELS.cancel}
          </button>
          <button
            className="bg-[var(--ink)] px-3 py-2 text-sm text-[var(--surface)] hover:opacity-90"
            onClick={onConfirm}
            type="button"
          >
            {UI_LABELS.regroup}
          </button>
        </div>
      </section>
    </div>
  );
}
