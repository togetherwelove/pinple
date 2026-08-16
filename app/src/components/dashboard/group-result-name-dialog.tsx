"use client";

import { useState } from "react";
import { Spinner } from "@/components/spinner";
import {
  GROUPING_LIMITS,
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  UI_LABELS,
} from "@/lib/config/app";

type GroupResultNameDialogProps = {
  initialName: string;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: (name: string) => void;
};

export function GroupResultNameDialog({
  initialName,
  isSaving,
  onCancel,
  onConfirm,
}: GroupResultNameDialogProps) {
  const [name, setName] = useState(initialName);
  const normalizedName = name.trim();

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

          if (normalizedName && !isSaving) {
            onConfirm(normalizedName);
          }
        }}
      >
        <h2 className="font-semibold">{UI_LABELS.saveResult}</h2>
        <label className="mt-4 block text-sm font-medium">
          {ROSTER_BOARD.resultName}
          <input
            autoFocus
            className="mt-1.5 w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            disabled={isSaving}
            maxLength={GROUPING_LIMITS.groupResultNameMaximumLength}
            onChange={(event) => setName(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            placeholder={ROSTER_BOARD.resultNamePlaceholder}
            value={name}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            {UI_LABELS.cancel}
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 text-sm ${
              normalizedName && !isSaving
                ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled
                : INPUT_DEPENDENT_BUTTON_CLASSES.disabled
            }`}
            disabled={!normalizedName || isSaving}
            type="submit"
          >
            {isSaving ? <Spinner size="sm" /> : null}
            {isSaving ? UI_LABELS.savingRoster : UI_LABELS.saveResult}
          </button>
        </div>
      </form>
    </div>
  );
}
