"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BoardConfirmationDialog } from "@/components/dashboard/board-confirmation-dialog";
import { GroupResultNameDialog } from "@/components/dashboard/group-result-name-dialog";
import { RosterBoard } from "@/components/dashboard/roster-board";
import { RosterBoardInput } from "@/components/dashboard/roster-board-input";
import { RegroupConfirmationDialog } from "@/components/dashboard/regroup-confirmation-dialog";
import { SavedGroupResultsToolbar } from "@/components/dashboard/saved-group-results-toolbar";
import { Spinner } from "@/components/spinner";
import { Toast } from "@/components/toast";
import {
  GROUPING_LIMITS,
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  TOAST_TONES,
  UI_LABELS,
  UI_MESSAGES,
  formatDefaultGroupResultName,
} from "@/lib/config/app";
import {
  addPeopleToDraft,
  allBoardPeople,
  createRosterBoardDraft,
  removePersonFromDraft,
  updateUnassignedPerson,
} from "@/lib/roster-board/draft";
import {
  createGroupedDraft,
  createGroupingPlan,
  createGroupResultMembers,
} from "@/lib/roster-board/group-result";
import { useRosterBoardStore } from "@/lib/roster-board/store";
import type {
  GroupMember,
  PersonInput,
  RosterBoardDraft,
  StoredGroupResult,
} from "@/lib/types/domain";

type WorkspaceProps = {
  savedGroupResults: StoredGroupResult[];
};

type PendingConfirmation =
  | { kind: "delete"; name: string; resultId: string }
  | { kind: "load"; resultId: string }
  | { kind: "new" }
  | { kind: "overwrite"; name: string };

type ToastState = {
  id: string;
  message: string;
  tone: (typeof TOAST_TONES)[keyof typeof TOAST_TONES];
};

type SaveGroupResultOutcome =
  | { duplicate: true }
  | { duplicate: false; result: StoredGroupResult };

async function saveGroupResult(
  name: string,
  draft: RosterBoardDraft,
  overwrite: boolean,
): Promise<SaveGroupResultOutcome> {
  const response = await fetch("/api/group-results", {
    body: JSON.stringify({
      name,
      overwrite,
      snapshot: {
        members: createGroupResultMembers(draft),
        people: allBoardPeople(draft),
      },
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const responseBody = (await response.json()) as {
    duplicate?: boolean;
    error?: string;
  } & StoredGroupResult;

  if (response.status === 409 && responseBody.duplicate) {
    return { duplicate: true };
  }

  if (!response.ok) {
    throw new Error(responseBody.error ?? UI_MESSAGES.saveFailed);
  }

  return { duplicate: false, result: responseBody };
}

async function deleteGroupResult(resultId: string) {
  const response = await fetch(`/api/group-results/${resultId}`, {
    method: "DELETE",
  });
  const responseBody = (await response.json()) as { error?: string; id?: string };

  if (!response.ok) {
    throw new Error(responseBody.error ?? UI_MESSAGES.groupResultDeleteFailed);
  }
}

function createClientMembers(people: PersonInput[]): GroupMember[] {
  return people.map((person) => ({ ...person, id: crypto.randomUUID() }));
}

export function Workspace({ savedGroupResults }: WorkspaceProps) {
  const draft = useRosterBoardStore((state) => state.draft);
  const hasHydrated = useRosterBoardStore((state) => state.hasHydrated);
  const initializeDraft = useRosterBoardStore((state) => state.initializeDraft);
  const replaceDraft = useRosterBoardStore((state) => state.replaceDraft);
  const setHasHydrated = useRosterBoardStore((state) => state.setHasHydrated);
  const hasInitializedGroupCount = useRef(false);
  const [confirmation, setConfirmation] =
    useState<PendingConfirmation | null>(null);
  const [isGrouping, setIsGrouping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegroupConfirmationOpen, setIsRegroupConfirmationOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [groupCountInput, setGroupCountInput] = useState("1");
  const [results, setResults] = useState(savedGroupResults);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const initialDraft = useMemo(
    () => createRosterBoardDraft([], null),
    [],
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

  function commitDraft(nextDraft: RosterBoardDraft) {
    replaceDraft(nextDraft);
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

    setIsGrouping(true);

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      replaceDraft(createGroupedDraft(currentDraft, groupCount));
    } finally {
      setIsGrouping(false);
    }
  }

  async function persistResult(name: string, overwrite: boolean) {
    setIsSaving(true);

    try {
      const outcome = await saveGroupResult(name, currentDraft, overwrite);

      if (outcome.duplicate) {
        setIsSaveDialogOpen(false);
        setConfirmation({ kind: "overwrite", name });
        return;
      }

      setResults((currentResults) => [
        outcome.result,
        ...currentResults.filter((result) => result.id !== outcome.result.id),
      ]);
      setSelectedResultId(outcome.result.id);
      setIsSaveDialogOpen(false);
      showToast(UI_MESSAGES.groupResultSaved);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : UI_MESSAGES.groupResultSaveFailed,
      );
    } finally {
      setIsSaving(false);
    }
  }

  function loadResult(resultId: string) {
    const result = results.find((item) => item.id === resultId);

    if (!result) {
      showError(UI_MESSAGES.groupResultNotFound);
      return;
    }

    const nextDraft = createRosterBoardDraft([], result.members);
    replaceDraft(nextDraft);
    setGroupCountInput(String(Math.max(nextDraft.groups.length, 1)));
    setSelectedResultId(result.id);
    showToast(UI_MESSAGES.groupResultLoaded);
  }

  function createNewResult() {
    replaceDraft(createRosterBoardDraft([], null));
    setGroupCountInput("1");
    setSelectedResultId("");
  }

  async function deleteSavedResult(resultId: string) {
    setIsDeleting(true);

    try {
      await deleteGroupResult(resultId);
      setResults((currentResults) =>
        currentResults.filter((result) => result.id !== resultId),
      );
      setSelectedResultId("");
      setConfirmation(null);
      showToast(UI_MESSAGES.groupResultDeleted);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : UI_MESSAGES.groupResultDeleteFailed,
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function resolveConfirmation() {
    if (!confirmation) {
      return;
    }

    const pendingConfirmation = confirmation;

    if (pendingConfirmation.kind === "delete") {
      void deleteSavedResult(pendingConfirmation.resultId);
      return;
    }

    setConfirmation(null);

    if (pendingConfirmation.kind === "load") {
      loadResult(pendingConfirmation.resultId);
      return;
    }

    if (pendingConfirmation.kind === "new") {
      createNewResult();
      return;
    }

    void persistResult(pendingConfirmation.name, true);
  }

  const confirmationContent = confirmation
    ? confirmation.kind === "delete"
      ? {
          confirmLabel: ROSTER_BOARD.deleteResult,
          message: UI_MESSAGES.groupResultDeleteConfirmation(
            confirmation.name,
          ),
          title: ROSTER_BOARD.deleteResultTitle,
          variant: "danger" as const,
        }
      : confirmation.kind === "load"
      ? {
          confirmLabel: UI_LABELS.loadResult,
          message: UI_MESSAGES.loadResultConfirmation,
          title: ROSTER_BOARD.loadResultTitle,
          variant: "default" as const,
        }
      : confirmation.kind === "new"
        ? {
            confirmLabel: ROSTER_BOARD.createNewResult,
            message: UI_MESSAGES.newResultConfirmation,
            title: ROSTER_BOARD.createNewResultTitle,
            variant: "danger" as const,
          }
        : {
            confirmLabel: UI_LABELS.overwrite,
            message: UI_MESSAGES.overwriteResultConfirmation,
            title: ROSTER_BOARD.overwriteResultTitle,
            variant: "danger" as const,
          }
    : null;

  const selectedResult = results.find(
    (result) => result.id === selectedResultId,
  );
  const suggestedResultName =
    selectedResult?.name ?? formatDefaultGroupResultName(new Date());

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
      {isSaveDialogOpen ? (
        <GroupResultNameDialog
          initialName={suggestedResultName}
          isSaving={isSaving}
          onCancel={() => setIsSaveDialogOpen(false)}
          onConfirm={(name) => void persistResult(name, false)}
        />
      ) : null}
      {confirmationContent ? (
        <BoardConfirmationDialog
          {...confirmationContent}
          isConfirming={isDeleting}
          onCancel={() => setConfirmation(null)}
          onConfirm={resolveConfirmation}
        />
      ) : null}
      <RosterBoard
        draft={currentDraft}
        leftPanelFooter={
          <div className="space-y-4">
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
            <SavedGroupResultsToolbar
              canSave={totalPeople > 0 && !isSaving}
              onCreateNew={() => {
                if (totalPeople > 0) {
                  setConfirmation({ kind: "new" });
                } else {
                  createNewResult();
                }
              }}
              onDelete={() => {
                if (selectedResult) {
                  setConfirmation({
                    kind: "delete",
                    name: selectedResult.name,
                    resultId: selectedResult.id,
                  });
                }
              }}
              onSave={() => setIsSaveDialogOpen(true)}
              onSelect={(resultId) => {
                if (!resultId) {
                  setSelectedResultId("");
                  return;
                }

                if (totalPeople > 0) {
                  setConfirmation({
                    kind: "load",
                    resultId,
                  });
                } else {
                  loadResult(resultId);
                }
              }}
              savedResults={results}
              selectedResultId={selectedResultId}
            />
          </div>
        }
        leftPanelHeader={
          <RosterBoardInput
            onAddPeople={handleAddPeople}
            onError={showError}
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
        totalPeople={totalPeople}
      />
    </main>
  );
}
