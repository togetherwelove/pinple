"use client";

import { Spinner } from "@/components/spinner";
import { UI_LABELS } from "@/lib/config/app";

type BoardConfirmationDialogProps = {
  confirmLabel: string;
  isConfirming?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  variant?: "danger" | "default";
};

export function BoardConfirmationDialog({
  confirmLabel,
  isConfirming = false,
  message,
  onCancel,
  onConfirm,
  title,
  variant = "default",
}: BoardConfirmationDialogProps) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
    >
      <section className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
            disabled={isConfirming}
            onClick={onCancel}
            type="button"
          >
            {UI_LABELS.cancel}
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              variant === "danger"
                ? "bg-red-700 hover:bg-red-800"
                : "bg-[var(--ink)] hover:opacity-90"
            }`}
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {isConfirming ? <Spinner size="sm" /> : null}
            {isConfirming ? UI_LABELS.deleting : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
