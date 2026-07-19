"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GroupResultNavigation } from "@/components/dashboard/group-result-navigation";
import { NewProjectWorkspace } from "@/components/dashboard/new-project-workspace";
import { RosterBoard } from "@/components/dashboard/roster-board";
import { RosterBoardInput } from "@/components/dashboard/roster-board-input";
import { RosterBoardSettings } from "@/components/dashboard/roster-board-settings";
import { Spinner } from "@/components/spinner";
import {
  GROUPING_LIMITS,
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  UI_LABELS,
  UI_MESSAGES,
  projectGroupResultRoute,
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
  GroupResultDetail,
  GroupResultSummary,
  PersonInput,
  RosterBoardDraft,
} from "@/lib/types/domain";

type Project = { id: string; people: BoardPerson[]; title: string };

type WorkspaceProps = {
  groupResults: GroupResultSummary[];
  project: Project | null;
  selectedGroupResult: GroupResultDetail | null;
};

type JsonMethod = "PATCH" | "POST";

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
  groupResults,
  project,
  selectedGroupResult,
}: {
  groupResults: GroupResultSummary[];
  project: Project;
  selectedGroupResult: GroupResultDetail | null;
}) {
  const router = useRouter();
  const selectedResult = selectedGroupResult;
  const draftKey = createBoardDraftKey(project.id, selectedResult?.id);
  const draft = useRosterBoardStore((state) => state.drafts[draftKey]);
  const hasHydrated = useRosterBoardStore((state) => state.hasHydrated);
  const initializeDraft = useRosterBoardStore((state) => state.initializeDraft);
  const replaceDraft = useRosterBoardStore((state) => state.replaceDraft);
  const setHasHydrated = useRosterBoardStore((state) => state.setHasHydrated);
  const saveQueue = useRef(Promise.resolve());
  const [isGrouping, setIsGrouping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const initialDraft = useMemo(
    () => createRosterBoardDraft(project.people, selectedResult?.members ?? null),
    [project.people, selectedResult?.members],
  );

  useEffect(() => {
    void Promise.resolve(useRosterBoardStore.persist.rehydrate()).then(() => setHasHydrated(true));
  }, [setHasHydrated]);

  useEffect(() => {
    if (hasHydrated) {
      initializeDraft(draftKey, initialDraft);
    }
  }, [draftKey, hasHydrated, initialDraft, initializeDraft]);

  function saveResultDraft(nextDraft: RosterBoardDraft) {
    if (!selectedResult) {
      return;
    }

    saveQueue.current = saveQueue.current
      .then(() =>
        jsonRequest(
          `/api/group-results/${selectedResult.id}`,
          "PATCH",
          { members: createGroupResultMembers(nextDraft) },
        ),
      )
      .then(() => setNotice(null))
      .catch((error: unknown) => {
        setNotice(error instanceof Error ? error.message : UI_MESSAGES.groupResultSaveFailed);
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
  const hasResultName = Boolean(selectedResult || resultName.trim());
  const canRunGrouping = totalPeople > 0 && hasGroups && hasResultName && !isGrouping;
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
    setNotice(ROSTER_BOARD.addedPeople);
  }

  async function runGrouping() {
    if (!canRunGrouping) {
      return;
    }

    const nextDraft = createGroupedDraft(draft);
    replaceDraft(draftKey, nextDraft);
    setIsGrouping(true);
    setNotice(null);

    try {
      if (selectedResult) {
        await saveQueue.current;
        await jsonRequest(
          `/api/group-results/${selectedResult.id}`,
          "PATCH",
          { members: createGroupResultMembers(nextDraft) },
        );
      } else {
        const result = await jsonRequest<{ id: string }>(
          `/api/projects/${project.id}/board-snapshots`,
          "POST",
          {
            members: createGroupResultMembers(nextDraft),
            name: resultName.trim(),
            people: allBoardPeople(nextDraft),
          },
        );
        router.push(projectGroupResultRoute(project.id, result.id));
      }

      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : UI_MESSAGES.groupResultSaveFailed);
    } finally {
      setIsGrouping(false);
    }
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-[var(--canvas)]">
      <RosterBoard
        draft={draft}
        leftPanelFooter={
          <div className="space-y-4">
            {!selectedResult ? (
              <label className="block border-b border-[var(--border)] pb-4 text-sm font-medium">
                {ROSTER_BOARD.groupResultName}
                <input
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5"
                  maxLength={GROUPING_LIMITS.groupResultNameMaximumLength}
                  onChange={(event) => setResultName(event.target.value)}
                  placeholder={ROSTER_BOARD.groupResultNamePlaceholder}
                  value={resultName}
                />
              </label>
            ) : null}
            <RosterBoardSettings
              compact
              draft={draft}
              onChange={(nextDraft) => commitDraft(nextDraft, false)}
            />
            <div className="flex flex-col items-stretch gap-3 border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-sm text-[var(--muted)]">{groupingMessage}</p>
              {!selectedResult && !resultName.trim() ? (
                <p className="text-xs text-[var(--muted)]">
                  {UI_MESSAGES.groupResultNameRequired}
                </p>
              ) : null}
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
        leftPanelHeader={<RosterBoardInput onAddPeople={handleAddPeople} onError={setNotice} />}
        onDraftChange={commitDraft}
        onRemovePerson={(personId, groupId) =>
          commitDraft(removePersonFromDraft(draft, personId, groupId))
        }
        onUpdateUnassignedPerson={(personId, updates) =>
          commitDraft(updateUnassignedPerson(draft, personId, updates))
        }
        rightPanelHeader={
          <>
            <GroupResultNavigation
              groupResults={groupResults}
              projectId={project.id}
              projectTitle={project.title}
              selectedGroupResultId={selectedResult?.id}
            />
            {notice ? (
              <div
                className="mb-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                {notice}
              </div>
            ) : null}
          </>
        }
        rosterTitle={selectedResult?.name ?? project.title}
        totalPeople={totalPeople}
      />
    </main>
  );
}

export function Workspace({
  groupResults,
  project,
  selectedGroupResult,
}: WorkspaceProps) {
  if (!project) {
    return <NewProjectWorkspace />;
  }

  return (
    <ProjectWorkspace
      groupResults={groupResults}
      project={project}
      selectedGroupResult={selectedGroupResult}
    />
  );
}
