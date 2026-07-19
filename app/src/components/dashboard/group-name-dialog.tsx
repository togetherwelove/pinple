"use client";

import { useState } from "react";
import {
  GROUPING_LIMITS,
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  UI_LABELS,
} from "@/lib/config/app";

type GroupNameDialogProps = {
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function GroupNameDialog({
  initialName,
  onClose,
  onSave,
}: GroupNameDialogProps) {
  const [name, setName] = useState(initialName);
  const normalizedName = name.trim();
  const canSave = normalizedName.length > 0;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
      role="dialog"
    >
      <form
        className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();

          if (canSave) {
            onSave(normalizedName);
          }
        }}
      >
        <h2 className="font-semibold">{ROSTER_BOARD.editGroupName}</h2>
        <label className="mt-4 block text-sm">
          {ROSTER_BOARD.groupName}
          <input
            autoFocus
            className="mt-1 w-full border border-[var(--border)] p-2"
            maxLength={GROUPING_LIMITS.groupNameMaximumLength}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
            onClick={onClose}
            type="button"
          >
            {UI_LABELS.cancel}
          </button>
          <button
            className={`px-3 py-2 text-sm ${canSave ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
            disabled={!canSave}
            type="submit"
          >
            {UI_LABELS.saveGroupName}
          </button>
        </div>
      </form>
    </div>
  );
}
