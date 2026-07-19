"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NewProjectWorkspace } from "@/components/dashboard/new-project-workspace";
import { RosterBoard } from "@/components/dashboard/roster-board";
import { RosterBoardInput } from "@/components/dashboard/roster-board-input";
import { RosterBoardSettings } from "@/components/dashboard/roster-board-settings";
import { Spinner } from "@/components/spinner";
import { Toast } from "@/components/toast";
import {
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  ROSTER_IMPORT,
  TOAST_TONES,
  UI_LABELS,
  UI_MESSAGES,
} from "@/lib/config/app";
import {
  addPeopleToDraft,
  allBoardPeople,
  createBoardDraftKey,
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
import type {
  GroupMember,
  GroupResultMembers,
  PersonInput,
  ProjectGroupResult,
  ProjectImportSource,
  RosterBoardDraft,
  RosterImportMode,
} from "@/lib/types/domain";

type Project = { id: string; people: BoardPerson[]; title: string };

type WorkspaceProps = {
  groupResult: ProjectGroupResult | null;
  project: Project | null;
  projectImportSources: ProjectImportSource[];
};

type JsonMethod = "PATCH" | "POST";

type ToastState = {
  id: string;
  message: string;
  tone: (typeof TOAST_TONES)[keyof typeof TOAST_TONES];
};

async function jsonRequest<T>(url: string, method: JsonMethod, body: unknown): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
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

function ProjectWorkspace({
  groupResult,
  project,
  projectImportSources,
}: {
  groupResult: ProjectGroupResult | null;
  project: Project;
  projectImportSources: ProjectImportSource[];
}) {
  const router = useRouter();
  const draftKey = createBoardDraftKey(project.id);
  const draft = useRosterBoardStore((state) => state.drafts[draftKey]);
  const hasHydrated = useRosterBoardStore((state) => state.hasHydrated);
  const initializeDraft = useRosterBoardStore((state) => state.initializeDraft);
  const replaceDraft = useRosterBoardStore((state) => state.replaceDraft);
  const setHasHydrated = useRosterBoardStore((state) => state.setHasHydrated);
  const groupResultId = useRef(groupResult?.id ?? null);
  const saveQueue = useRef(Promise.resolve());
  const [isGrouping, setIsGrouping] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const initialDraft = useMemo(
    () => createRosterBoardDraft(project.people, groupResult?.members ?? null),
    [groupResult?.members, project.people],
  );

  useEffect(() => {
    void Promise.resolve(useRosterBoardStore.persist.rehydrate()).then(() => setHasHydrated(true));
  }, [setHasHydrated]);

  useEffect(() => {
    if (hasHydrated) {
      initializeDraft(draftKey, initialDraft);
    }
  }, [draftKey, hasHydrated, initialDraft, initializeDraft]);

  useEffect(() => {
    groupResultId.current = groupResult?.id ?? null;
  }, [groupResult?.id]);

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
    const resultId = groupResultId.current;

    if (!resultId) {
      return;
    }

    saveQueue.current = saveQueue.current
      .then(() =>
        jsonRequest(
          `/api/group-results/${resultId}`,
          "PATCH",
          { members: createGroupResultMembers(nextDraft) },
        ),
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
    replaceDraft(draftKey, nextDraft);

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

  const totalPeople = allBoardPeople(draft).length;
  const hasGroups = draft.groups.length > 0;
  const groupingPlan = hasGroups ? createGroupingPlan(draft) : null;
  const canRunGrouping = totalPeople > 0 && hasGroups && !isGrouping;
  const groupingMessage =
    totalPeople === 0
      ? UI_MESSAGES.boardGroupingRequired
      : !hasGroups
        ? UI_MESSAGES.groupRequired
        : groupingPlan
          ? ROSTER_BOARD.distributionPreview(groupingPlan.groupSizes)
          : UI_MESSAGES.invalidInput;

  function handleAddPeople(people: PersonInput[]) {
    commitDraft(addPeopleToDraft(draft, createClientMembers(people)));
    showToast(ROSTER_BOARD.addedPeople);
  }

  async function handleImportProject(
    source: ProjectImportSource,
    mode: RosterImportMode,
  ) {
    await saveQueue.current;
    const result = await jsonRequest<{
      groupResultId: string | null;
      members: GroupResultMembers;
      people: BoardPerson[];
    }>(`/api/projects/${project.id}/import-roster`, "POST", {
      mode,
      sourceProjectId: source.id,
    });
    const nextDraft = createRosterBoardDraft(result.people, result.members);

    groupResultId.current = result.groupResultId;
    replaceDraft(draftKey, nextDraft);
    showToast(ROSTER_IMPORT.success(source.title));
    router.refresh();
  }

  async function runGrouping() {
    if (!canRunGrouping) {
      return;
    }

    const nextDraft = createGroupedDraft(draft);
    replaceDraft(draftKey, nextDraft);
    setIsGrouping(true);

    try {
      await saveQueue.current;
      const result = await jsonRequest<{ id: string }>(
        `/api/projects/${project.id}/board-snapshots`,
        "POST",
        {
          members: createGroupResultMembers(nextDraft),
          people: allBoardPeople(nextDraft),
        },
      );

      groupResultId.current = result.id;
      router.refresh();
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
      <RosterBoard
        draft={draft}
        leftPanelFooter={
          <div className="space-y-4">
            <RosterBoardSettings
              compact
              draft={draft}
              onChange={(nextDraft) => commitDraft(nextDraft, false)}
            />
            <div className="flex flex-col items-stretch gap-3 border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-sm text-[var(--muted)]">{groupingMessage}</p>
              <button
                className={`flex items-center justify-center gap-2 px-4 py-2 text-sm ${canRunGrouping ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
                disabled={!canRunGrouping}
                onClick={() => void runGrouping()}
                type="button"
              >
                {isGrouping ? <Spinner size="sm" /> : null}
                {isGrouping ? UI_LABELS.grouping : ROSTER_BOARD.autoGrouping}
              </button>
            </div>
          </div>
        }
        leftPanelHeader={
          <RosterBoardInput
            currentPeopleCount={totalPeople}
            onAddPeople={handleAddPeople}
            onError={showError}
            onImportProject={handleImportProject}
            projectImportSources={projectImportSources}
          />
        }
        onDraftChange={commitDraft}
        onRemovePerson={(personId, groupId) =>
          commitDraft(removePersonFromDraft(draft, personId, groupId))
        }
        onUpdateUnassignedPerson={(personId, updates) =>
          commitDraft(updateUnassignedPerson(draft, personId, updates))
        }
        rightPanelHeader={
          <>
            <section className="mb-5 border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--muted)]">{ROSTER_BOARD.project}</p>
              <h1 className="mt-1 text-lg font-semibold">{project.title}</h1>
            </section>
          </>
        }
        rosterTitle={project.title}
        totalPeople={totalPeople}
      />
    </main>
  );
}

export function Workspace({
  groupResult,
  project,
  projectImportSources,
}: WorkspaceProps) {
  if (!project) {
    return <NewProjectWorkspace />;
  }

  return (
    <ProjectWorkspace
      groupResult={groupResult}
      project={project}
      projectImportSources={projectImportSources}
    />
  );
}
