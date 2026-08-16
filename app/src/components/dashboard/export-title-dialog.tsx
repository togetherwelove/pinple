"use client";

import { useState } from "react";
import { EXCEL_EXPORT, ROSTER_BOARD, UI_LABELS } from "@/lib/config/app";

type ExportTitleDialogProps = {
  dialogTitle: string;
  initialTitle: string;
  onCancel: () => void;
  onConfirm: (title: string) => void;
};

export function ExportTitleDialog({
  dialogTitle,
  initialTitle,
  onCancel,
  onConfirm,
}: ExportTitleDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const normalizedTitle = title.trim();

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
    >
      <form
        className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();

          if (normalizedTitle) {
            onConfirm(normalizedTitle);
          }
        }}
      >
        <h2 className="font-semibold">{dialogTitle}</h2>
        <label className="mt-4 block text-sm font-medium">
          {ROSTER_BOARD.exportTitle}
          <span className="mt-1.5 flex">
            <input
              autoFocus
              className="min-w-0 flex-1 border border-r-0 border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              maxLength={EXCEL_EXPORT.maximumTitleLength}
              onChange={(event) => setTitle(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              value={title}
            />
            <span className="flex shrink-0 items-center border border-[var(--border)] bg-[var(--canvas)] px-3 text-sm text-[var(--muted)]">
              {EXCEL_EXPORT.fileExtension}
            </span>
          </span>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
            onClick={onCancel}
            type="button"
          >
            {UI_LABELS.cancel}
          </button>
          <button
            className={`px-3 py-2 text-sm ${normalizedTitle ? "bg-[var(--ink)] text-[var(--surface)] hover:opacity-90" : "cursor-not-allowed bg-[var(--canvas)] text-[var(--muted)]"}`}
            disabled={!normalizedTitle}
            type="submit"
          >
            {ROSTER_BOARD.exportRoster}
          </button>
        </div>
      </form>
    </div>
  );
}
