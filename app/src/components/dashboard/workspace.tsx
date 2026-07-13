"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APP_NAME,
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  ROSTER_CREATION,
  ROUTES,
  UI_LABELS,
  UI_MESSAGES,
} from "@/lib/config/app";
import { RosterBoard } from "@/components/dashboard/roster-board";
import { RosterBoardInput } from "@/components/dashboard/roster-board-input";
import { RosterBoardSettings } from "@/components/dashboard/roster-board-settings";
import { Spinner } from "@/components/spinner";
import { appointLeaders } from "@/lib/grouping/leader-assignment";
import { distributeUnassignedPeople } from "@/lib/grouping/distribute-people";
import {
  allBoardPeople,
  createRosterBoardDraft,
  remainingGroupCapacity,
  type BoardPerson,
} from "@/lib/roster-board/draft";
import { useRosterBoardStore } from "@/lib/roster-board/store";
import type { GroupMember, GroupResultMembers, PersonInput, RosterBoardDraft } from "@/lib/types/domain";

type Project = { id: string; people: BoardPerson[]; title: string };

type WorkspaceProps = {
  initialGroups: GroupResultMembers | null;
  project: Project | null;
};

async function jsonRequest<T>(url: string, method: "POST", body: unknown): Promise<T> {
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

function NewRosterWorkspace() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const canCreate = title.trim().length > 0 && !isCreating;

  async function createRoster() {
    setIsCreating(true);

    try {
      const roster = await jsonRequest<{ id: string }>("/api/projects", "POST", { title });
      router.push(`${ROUTES.rosters}?project=${roster.id}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : UI_MESSAGES.saveFailed);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-[var(--canvas)] p-6">
      <section className="w-full max-w-md text-center">
        <p className="text-sm text-[var(--muted)]">{ROSTER_CREATION.subtitle}</p>
        <h1 className="mt-3 text-2xl font-semibold">{ROSTER_CREATION.heading}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{ROSTER_CREATION.description}</p>
        {notice ? <p className="mt-4 text-sm text-red-700" role="alert">{notice}</p> : null}
        <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-5 text-left">
          <input
            className="w-full border border-[var(--border)] p-3"
            onChange={(event) => setTitle(event.target.value)}
            placeholder={ROSTER_CREATION.inputPlaceholder}
            value={title}
          />
          <button
            className={`mt-3 flex items-center gap-2 px-4 py-3 ${canCreate ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
            disabled={!canCreate}
            onClick={() => void createRoster()}
            type="button"
          >
            {isCreating ? <Spinner size="sm" /> : <Plus size={16} />}
            {isCreating ? UI_LABELS.creatingRoster : ROSTER_CREATION.start}
          </button>
          {!title.trim() ? <p className="mt-2 text-xs text-[var(--muted)]">{UI_MESSAGES.projectTitleRequired}</p> : null}
        </div>
      </section>
    </main>
  );
}

function RosterWorkspace({
  initialGroups,
  project,
}: {
  initialGroups: GroupResultMembers | null;
  project: Project;
}) {
  const router = useRouter();
  const draft = useRosterBoardStore((state) => state.drafts[project.id]);
  const hasHydrated = useRosterBoardStore((state) => state.hasHydrated);
  const addPeople = useRosterBoardStore((state) => state.addPeople);
  const initializeDraft = useRosterBoardStore((state) => state.initializeDraft);
  const removePerson = useRosterBoardStore((state) => state.removePerson);
  const replaceDraft = useRosterBoardStore((state) => state.replaceDraft);
  const setHasHydrated = useRosterBoardStore((state) => state.setHasHydrated);
  const updateGroupCount = useRosterBoardStore((state) => state.updateGroupCount);
  const updateGroupTargetSize = useRosterBoardStore((state) => state.updateGroupTargetSize);
  const updateUnassignedPerson = useRosterBoardStore((state) => state.updateUnassignedPerson);
  const [isGrouping, setIsGrouping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const initialDraft = useMemo(
    () => createRosterBoardDraft(project.people, initialGroups),
    [initialGroups, project.people],
  );

  useEffect(() => {
    void Promise.resolve(useRosterBoardStore.persist.rehydrate()).then(() => setHasHydrated(true));
  }, [setHasHydrated]);

  useEffect(() => {
    if (hasHydrated) {
      initializeDraft(project.id, initialDraft);
    }
  }, [hasHydrated, initialDraft, initializeDraft, project.id]);

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
  const capacity = remainingGroupCapacity(draft.groups);
  const canRunGrouping = draft.unassigned.length > 0 && capacity === draft.unassigned.length && !isGrouping;
  const groupingMessage =
    draft.unassigned.length === 0
      ? UI_MESSAGES.boardGroupingRequired
      : capacity === draft.unassigned.length
        ? ROSTER_BOARD.remainingCapacity(capacity)
        : UI_MESSAGES.boardCapacityMismatch;

  function handleAddPeople(people: PersonInput[]) {
    addPeople(project.id, createClientMembers(people));
    setNotice(ROSTER_BOARD.addedPeople);
  }

  async function runGrouping() {
    if (!canRunGrouping) {
      return;
    }

    const nextDraft: RosterBoardDraft = {
      ...draft,
      groups: appointLeaders(
        distributeUnassignedPeople(draft.unassigned, draft.groups, draft.strategy),
        draft.leaderSelectionMode,
      ),
      unassigned: [],
    };

    replaceDraft(project.id, nextDraft);
    setIsGrouping(true);
    setNotice(null);

    try {
      await jsonRequest(`/api/projects/${project.id}/board-snapshots`, "POST", {
        members: { groups: nextDraft.groups, strategy: nextDraft.strategy },
        people: allBoardPeople(nextDraft),
      });
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : UI_MESSAGES.boardSaveFailed);
    } finally {
      setIsGrouping(false);
    }
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-[var(--canvas)]">
      <RosterBoard
        draft={draft}
        leftPanelHeader={<RosterBoardInput onAddPeople={handleAddPeople} onError={setNotice} />}
        onDraftChange={(nextDraft) => replaceDraft(project.id, nextDraft)}
        onRemovePerson={(personId, groupId) => removePerson(project.id, personId, groupId)}
        onUpdateUnassignedPerson={(personId, updates) =>
          updateUnassignedPerson(project.id, personId, updates)
        }
        rightPanelHeader={
          <div className="space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--muted)]">{APP_NAME}</p>
                <h1 className="text-2xl font-semibold">{project.title}</h1>
              </div>
              <span className="text-sm text-[var(--muted)]">{totalPeople}명</span>
            </header>
            {notice ? (
              <div className="border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
                {notice}
              </div>
            ) : null}
            <RosterBoardSettings
              draft={draft}
              onChange={(nextDraft) => replaceDraft(project.id, nextDraft)}
              onGroupCountChange={(groupCount) => updateGroupCount(project.id, groupCount)}
              onTargetSizeChange={(groupId, targetSize) => updateGroupTargetSize(project.id, groupId, targetSize)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--muted)]">{groupingMessage}</p>
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm ${canRunGrouping ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
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
        rosterTitle={project.title}
      />
    </main>
  );
}

export function Workspace({ initialGroups, project }: WorkspaceProps) {
  if (!project) {
    return <NewRosterWorkspace />;
  }

  return <RosterWorkspace initialGroups={initialGroups} project={project} />;
}
