"use client";

import { useState } from "react";
import { EXCEL_EXPORT, ROSTER_BOARD, UI_LABELS } from "@/lib/config/app";

type RosterExportDialogProps = {
  onCancel: () => void;
  onConfirm: (title: string) => void;
};

export function RosterExportDialog({ onCancel, onConfirm }: RosterExportDialogProps) {
  const [title, setTitle] = useState<string>(ROSTER_BOARD.rosterTitle);
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
        <h2 className="font-semibold">{ROSTER_BOARD.exportRosterTitle}</h2>
        <label className="mt-4 block text-sm font-medium">
          {ROSTER_BOARD.exportTitle}
          <input
            autoFocus
            className="mt-1.5 w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            maxLength={EXCEL_EXPORT.maximumTitleLength}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
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
