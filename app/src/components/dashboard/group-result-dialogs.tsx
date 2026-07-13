"use client";

import { Spinner } from "@/components/spinner";
import {
  GROUPING_LIMITS,
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  UI_LABELS,
} from "@/lib/config/app";

type RenameGroupResultDialogProps = {
  isSubmitting: boolean;
  name: string;
  onCancel: () => void;
  onChange: (name: string) => void;
  onSubmit: () => void;
};

type DeleteGroupResultDialogProps = {
  isSubmitting: boolean;
  name: string;
  onCancel: () => void;
  onSubmit: () => void;
};

export function RenameGroupResultDialog({
  isSubmitting,
  name,
  onCancel,
  onChange,
  onSubmit,
}: RenameGroupResultDialogProps) {
  const canSubmit = name.trim().length > 0 && !isSubmitting;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
      role="dialog"
    >
      <section className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        <h2 className="font-semibold">{ROSTER_BOARD.renameGroupResult}</h2>
        <label className="mt-4 block text-sm font-medium">
          {ROSTER_BOARD.groupResultName}
          <input
            autoFocus
            className="mt-2 w-full border border-[var(--border)] bg-[var(--surface)] p-2"
            maxLength={GROUPING_LIMITS.groupResultNameMaximumLength}
            onChange={(event) => onChange(event.target.value)}
            value={name}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            {UI_LABELS.cancel}
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 text-sm ${canSubmit ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
            disabled={!canSubmit}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? <Spinner size="sm" /> : null}
            {isSubmitting ? UI_LABELS.renaming : UI_LABELS.saveName}
          </button>
        </div>
      </section>
    </div>
  );
}

export function DeleteGroupResultDialog({
  isSubmitting,
  name,
  onCancel,
  onSubmit,
}: DeleteGroupResultDialogProps) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
      role="dialog"
    >
      <section className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        <h2 className="font-semibold">{ROSTER_BOARD.deleteGroupResult}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {ROSTER_BOARD.deleteGroupResultDescription(name)}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            {UI_LABELS.cancel}
          </button>
          <button
            className="flex items-center gap-2 bg-[var(--danger)] px-3 py-2 text-sm text-[var(--danger-foreground)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? <Spinner size="sm" /> : null}
            {isSubmitting ? UI_LABELS.deleting : UI_LABELS.delete}
          </button>
        </div>
      </section>
    </div>
  );
}
