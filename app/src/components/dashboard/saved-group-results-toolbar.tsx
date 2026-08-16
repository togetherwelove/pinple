"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import {
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  UI_LABELS,
  UI_MESSAGES,
} from "@/lib/config/app";
import type { StoredGroupResult } from "@/lib/types/domain";

type SavedGroupResultsToolbarProps = {
  canSave: boolean;
  onCreateNew: () => void;
  onDelete: () => void;
  onSave: () => void;
  onSelect: (resultId: string) => void;
  savedResults: StoredGroupResult[];
  selectedResultId: string;
};

export function SavedGroupResultsToolbar({
  canSave,
  onCreateNew,
  onDelete,
  onSave,
  onSelect,
  savedResults,
  selectedResultId,
}: SavedGroupResultsToolbarProps) {
  const hasSelectedResult = Boolean(selectedResultId);

  return (
    <div className="flex flex-wrap items-end gap-2 border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex basis-full items-center justify-between gap-2">
        <span className="text-sm font-medium">{ROSTER_BOARD.savedResults}</span>
        <button
          aria-label={ROSTER_BOARD.createNewResult}
          className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
          onClick={onCreateNew}
          title={ROSTER_BOARD.createNewResult}
          type="button"
        >
          <Plus size={16} />
        </button>
      </div>
      <label className="min-w-0 basis-full text-sm font-medium">
        <span className="sr-only">{ROSTER_BOARD.savedResults}</span>
        <select
          className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          disabled={savedResults.length === 0}
          onChange={(event) => onSelect(event.target.value)}
          value={selectedResultId}
        >
          <option value="">
            {savedResults.length > 0
              ? ROSTER_BOARD.selectSavedResult
              : UI_MESSAGES.noSavedGroupResults}
          </option>
          {savedResults.map((result) => (
            <option key={result.id} value={result.id}>
              {result.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className={`flex items-center gap-2 px-3 py-2 text-sm ${
          canSave
            ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled
            : INPUT_DEPENDENT_BUTTON_CLASSES.disabled
        }`}
        disabled={!canSave}
        onClick={onSave}
        type="button"
      >
        <Save size={16} />
        {UI_LABELS.saveResult}
      </button>
      <button
        className={`flex items-center gap-2 border px-3 py-2 text-sm ${
          hasSelectedResult
            ? "border-red-200 bg-[var(--surface)] text-red-700 hover:bg-red-50"
            : "cursor-not-allowed border-[var(--border)] bg-[var(--canvas)] text-[var(--muted)]"
        }`}
        disabled={!hasSelectedResult}
        onClick={onDelete}
        type="button"
      >
        <Trash2 size={16} />
        {ROSTER_BOARD.deleteResult}
      </button>
    </div>
  );
}
