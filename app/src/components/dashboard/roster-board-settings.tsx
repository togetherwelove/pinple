"use client";

import {
  GROUPING_LIMITS,
  GROUPING_TOGGLE_LABELS,
  LEADER_SELECTION_OPTIONS,
  ROSTER_BOARD,
  UI_LABELS,
  formatGroupName,
} from "@/lib/config/app";
import type { LeaderSelectionMode, RosterBoardDraft } from "@/lib/types/domain";

type RosterBoardSettingsProps = {
  draft: RosterBoardDraft;
  onChange: (draft: RosterBoardDraft) => void;
  onGroupCountChange: (groupCount: number) => void;
  onTargetSizeChange: (groupId: string, targetSize: number) => void;
};

function resolveStrategy(useSimilarAge: boolean, separateGender: boolean) {
  if (useSimilarAge && separateGender) {
    return "gender_age_similar" as const;
  }

  if (useSimilarAge) {
    return "age_similar" as const;
  }

  if (separateGender) {
    return "gender_separated" as const;
  }

  return "even" as const;
}

export function RosterBoardSettings({
  draft,
  onChange,
  onGroupCountChange,
  onTargetSizeChange,
}: RosterBoardSettingsProps) {
  const useSimilarAge = draft.strategy === "age_similar" || draft.strategy === "gender_age_similar";
  const separateGender =
    draft.strategy === "gender_separated" || draft.strategy === "gender_age_similar";

  function updateStrategy(nextSimilarAge: boolean, nextSeparateGender: boolean) {
    onChange({
      ...draft,
      strategy: resolveStrategy(nextSimilarAge, nextSeparateGender),
    });
  }

  return (
    <section className="border-b border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(130px,180px)_minmax(240px,1fr)_minmax(180px,240px)]">
        <label className="text-sm font-medium">
            {ROSTER_BOARD.groupCount}
          <input
            className="mt-2 w-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5"
            max={GROUPING_LIMITS.maximumGroupCount}
            min={GROUPING_LIMITS.minimumGroupCount}
            onChange={(event) => onGroupCountChange(Number(event.target.value))}
            type="number"
            value={draft.groups.length}
          />
        </label>
        <div>
          <p className="text-sm font-medium">{ROSTER_BOARD.groupTargets}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {draft.groups.map((group, index) => (
              <label className="flex items-center justify-between gap-2 text-sm" key={group.id}>
                <span>{formatGroupName(index)}</span>
                <input
                  className="w-16 border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
                  min={Math.max(GROUPING_LIMITS.minimumPeoplePerGroup, group.members.length)}
                  onChange={(event) => onTargetSizeChange(group.id, Number(event.target.value))}
                  type="number"
                  value={group.targetSize}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <fieldset>
            <legend className="text-sm font-medium">{ROSTER_BOARD.groupingStrategy}</legend>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                checked={useSimilarAge}
                onChange={(event) => updateStrategy(event.target.checked, separateGender)}
                type="checkbox"
              />
              {GROUPING_TOGGLE_LABELS.ageSimilar}
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                checked={separateGender}
                onChange={(event) => updateStrategy(useSimilarAge, event.target.checked)}
                type="checkbox"
              />
              {GROUPING_TOGGLE_LABELS.genderSeparated}
            </label>
          </fieldset>
          <label className="block text-sm font-medium">
            {UI_LABELS.leaderAssignmentMode}
            <select
              className="mt-2 w-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
              onChange={(event) =>
                onChange({
                  ...draft,
                  leaderSelectionMode: event.target.value as LeaderSelectionMode,
                })
              }
              value={draft.leaderSelectionMode}
            >
              {LEADER_SELECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
