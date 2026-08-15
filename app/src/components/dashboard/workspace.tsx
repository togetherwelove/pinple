"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RosterBoard } from "@/components/dashboard/roster-board";
import { RosterBoardInput } from "@/components/dashboard/roster-board-input";
import { RegroupConfirmationDialog } from "@/components/dashboard/regroup-confirmation-dialog";
import { Spinner } from "@/components/spinner";
import { Toast } from "@/components/toast";
import {
  GROUPING_LIMITS,
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  TOAST_TONES,
  UI_LABELS,
  UI_MESSAGES,
} from "@/lib/config/app";
import {
  addPeopleToDraft,
  allBoardPeople,
  createRosterBoardDraft,
  removePersonFromDraft,
  type BoardPerson,
  updateUnassignedPerson,
} from "@/lib/roster-board/draft";
import {
  createGroupedDraft,
  createGroupingPlan,
  createGroupResultMembers,
} from "@/lib/roster-board/group-result";
import { useRosterBoardStore } from "@/lib/roster-board/store";
import { exportRosterToExcel } from "@/lib/roster/export-roster";
import type {
  GroupMember,
  PersonInput,
  RosterBoardDraft,
  StoredGroupResult,
} from "@/lib/types/domain";

type WorkspaceProps = {
  groupResult: StoredGroupResult | null;
  people: BoardPerson[];
};

type ToastState = {
  id: string;
  message: string;
  tone: (typeof TOAST_TONES)[keyof typeof TOAST_TONES];
};

async function saveRoster<T>(body: unknown): Promise<T> {
  const response = await fetch("/api/roster", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const responseBody = (await response.json()) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(responseBody.error ?? UI_MESSAGES.saveFailed);
  }

  return responseBody;
}

function createClientMembers(people: PersonInput[]): GroupMember[] {
  return people.map((person) => ({ ...person, id: crypto.randomUUID() }));
}

export function Workspace({
  groupResult,
  people,
}: WorkspaceProps) {
  const draft = useRosterBoardStore((state) => state.draft);
  const hasHydrated = useRosterBoardStore((state) => state.hasHydrated);
  const initializeDraft = useRosterBoardStore((state) => state.initializeDraft);
  const replaceDraft = useRosterBoardStore((state) => state.replaceDraft);
  const setHasHydrated = useRosterBoardStore((state) => state.setHasHydrated);
  const hasGroupResult = useRef(groupResult !== null);
  const saveQueue = useRef(Promise.resolve());
  const hasInitializedGroupCount = useRef(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [isRegroupConfirmationOpen, setIsRegroupConfirmationOpen] = useState(false);
  const [groupCountInput, setGroupCountInput] = useState("1");
  const [toast, setToast] = useState<ToastState | null>(null);
  const initialDraft = useMemo(
    () => createRosterBoardDraft(people, groupResult?.members ?? null),
    [groupResult?.members, people],
  );

  useEffect(() => {
    void Promise.resolve(useRosterBoardStore.persist.rehydrate()).then(() => setHasHydrated(true));
  }, [setHasHydrated]);

  useEffect(() => {
    if (hasHydrated) {
      initializeDraft(initialDraft);
    }
  }, [hasHydrated, initialDraft, initializeDraft]);

  useEffect(() => {
    hasGroupResult.current = groupResult !== null;
  }, [groupResult]);

  useEffect(() => {
    if (draft && !hasInitializedGroupCount.current) {
      setGroupCountInput(String(Math.max(draft.groups.length, 1)));
      hasInitializedGroupCount.current = true;
    }
  }, [draft]);

  const dismissToast = useCallback(() => setToast(null), []);

  function showToast(
    message: string,
    tone: ToastState["tone"] = TOAST_TONES.success,
  ) {
    setToast({ id: crypto.randomUUID(), message, tone });
  }

  function showError(message: string) {
    showToast(message, TOAST_TONES.error);
  }

  function saveResultDraft(nextDraft: RosterBoardDraft) {
    if (!hasGroupResult.current) {
      return;
    }

    saveQueue.current = saveQueue.current
      .then(() =>
        saveRoster({
          members: createGroupResultMembers(nextDraft),
          people: allBoardPeople(nextDraft),
        }),
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        showError(
          error instanceof Error
            ? error.message
            : UI_MESSAGES.groupResultSaveFailed,
        );
      });
  }

  function commitDraft(nextDraft: RosterBoardDraft, saveResult = true) {
    replaceDraft(nextDraft);

    if (saveResult) {
      saveResultDraft(nextDraft);
    }
  }

  if (!hasHydrated || !draft) {
    return (
      <main className="flex min-h-full items-center justify-center bg-[var(--canvas)] p-6">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Spinner size="sm" />
          {UI_LABELS.loadingBoard}
        </div>
      </main>
    );
  }

  const currentDraft = draft;
  const totalPeople = allBoardPeople(currentDraft).length;
  const maximumGroupCount = Math.min(
    totalPeople,
    GROUPING_LIMITS.maximumGroupCount,
  );
  const groupCount = Number(groupCountInput);
  const hasValidGroupCount =
    Number.isInteger(groupCount) &&
    groupCount >= GROUPING_LIMITS.minimumGroupCount &&
    groupCount <= maximumGroupCount;
  const groupingPlan = hasValidGroupCount
    ? createGroupingPlan(currentDraft, groupCount)
    : null;
  const canRunGrouping = totalPeople > 0 && hasValidGroupCount && !isGrouping;
  const groupingMessage =
    totalPeople === 0
      ? UI_MESSAGES.boardGroupingRequired
      : groupingPlan
        ? ROSTER_BOARD.distributionPreview(groupingPlan.groupSizes)
        : UI_MESSAGES.groupCountInvalid(maximumGroupCount);

  function handleAddPeople(people: PersonInput[]) {
    commitDraft(addPeopleToDraft(currentDraft, createClientMembers(people)));
    showToast(ROSTER_BOARD.addedPeople);
  }

  async function runGrouping() {
    if (!canRunGrouping) {
      return;
    }

    const nextDraft = createGroupedDraft(currentDraft, groupCount);
    replaceDraft(nextDraft);
    setIsGrouping(true);

    try {
      await saveQueue.current;
      await saveRoster<{ id: string }>({
        members: createGroupResultMembers(nextDraft),
        people: allBoardPeople(nextDraft),
      });

      hasGroupResult.current = true;
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : UI_MESSAGES.groupResultSaveFailed,
      );
    } finally {
      setIsGrouping(false);
    }
  }

  function requestGrouping() {
    if (currentDraft.groups.some((group) => group.members.length > 0)) {
      setIsRegroupConfirmationOpen(true);
      return;
    }

    void runGrouping();
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-[var(--canvas)]">
      {toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          onDismiss={dismissToast}
          tone={toast.tone}
        />
      ) : null}
      {isRegroupConfirmationOpen ? (
        <RegroupConfirmationDialog
          onCancel={() => setIsRegroupConfirmationOpen(false)}
          onConfirm={() => {
            setIsRegroupConfirmationOpen(false);
            void runGrouping();
          }}
        />
      ) : null}
      <RosterBoard
        draft={currentDraft}
        leftPanelFooter={
          <div className="flex flex-col items-stretch gap-3 border border-[var(--border)] bg-[var(--surface)] p-3">
            <label className="text-sm font-medium">
              {ROSTER_BOARD.groupCount}
              <input
                className="mt-2 w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                inputMode="numeric"
                max={Math.max(maximumGroupCount, 1)}
                min={GROUPING_LIMITS.minimumGroupCount}
                onChange={(event) => setGroupCountInput(event.target.value)}
                type="number"
                value={groupCountInput}
              />
            </label>
            <p className="text-sm text-[var(--muted)]">{groupingMessage}</p>
            <button
              className={`flex items-center justify-center gap-2 px-4 py-2 text-sm ${canRunGrouping ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
              disabled={!canRunGrouping}
              onClick={requestGrouping}
              type="button"
            >
              {isGrouping ? <Spinner size="sm" /> : null}
              {isGrouping ? UI_LABELS.grouping : ROSTER_BOARD.autoGrouping}
            </button>
          </div>
        }
        leftPanelHeader={
          <RosterBoardInput
            canExport={totalPeople > 0}
            onAddPeople={handleAddPeople}
            onError={showError}
            onExport={(title) =>
              exportRosterToExcel(
                allBoardPeople(currentDraft),
                title,
              )
            }
          />
        }
        onDraftChange={commitDraft}
        onRemovePerson={(personId, groupId) =>
          commitDraft(removePersonFromDraft(currentDraft, personId, groupId))
        }
        onUpdateUnassignedPerson={(personId, updates) =>
          commitDraft(updateUnassignedPerson(currentDraft, personId, updates))
        }
        rightPanelHeader={null}
        rosterTitle={ROSTER_BOARD.rosterTitle}
        totalPeople={totalPeople}
      />
    </main>
  );
}
