"use client";

import { ListPlus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DeleteGroupResultDialog,
  RenameGroupResultDialog,
} from "@/components/dashboard/group-result-dialogs";
import {
  ROSTER_BOARD,
  UI_MESSAGES,
  projectGroupResultRoute,
  rosterProjectRoute,
} from "@/lib/config/app";
import { createBoardDraftKey } from "@/lib/roster-board/draft";
import { useRosterBoardStore } from "@/lib/roster-board/store";
import type { GroupResultSummary } from "@/lib/types/domain";

type GroupResultNavigationProps = {
  groupResults: GroupResultSummary[];
  projectId: string;
  projectTitle: string;
  selectedGroupResultId?: string;
};

type ResultRequestMethod = "DELETE" | "PATCH";

function navigationClass(isActive: boolean) {
  return `shrink-0 border text-sm ${
    isActive
      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)]"
  }`;
}

async function resultRequest(
  resultId: string,
  method: ResultRequestMethod,
  body?: unknown,
) {
  const response = await fetch(`/api/group-results/${resultId}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    method,
  });
  const result = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(result.error ?? UI_MESSAGES.saveFailed);
  }
}

export function GroupResultNavigation({
  groupResults,
  projectId,
  projectTitle,
  selectedGroupResultId,
}: GroupResultNavigationProps) {
  const router = useRouter();
  const removeDraft = useRosterBoardStore((state) => state.removeDraft);
  const [editingResult, setEditingResult] = useState<GroupResultSummary | null>(null);
  const [deletingResult, setDeletingResult] = useState<GroupResultSummary | null>(null);
  const [editedName, setEditedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openRenameDialog(result: GroupResultSummary) {
    setEditedName(result.name);
    setEditingResult(result);
    setErrorMessage(null);
  }

  function openDeleteDialog(result: GroupResultSummary) {
    setDeletingResult(result);
    setErrorMessage(null);
  }

  async function renameResult() {
    const name = editedName.trim();

    if (!editingResult || !name) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resultRequest(editingResult.id, "PATCH", { name });
      setEditingResult(null);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : UI_MESSAGES.groupResultRenameFailed,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteResult() {
    if (!deletingResult) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resultRequest(deletingResult.id, "DELETE");
      removeDraft(createBoardDraftKey(projectId, deletingResult.id));
      setDeletingResult(null);

      if (deletingResult.id === selectedGroupResultId) {
        router.push(rosterProjectRoute(projectId));
      } else {
        router.refresh();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : UI_MESSAGES.groupResultDeleteFailed,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mb-5 border border-[var(--border)] bg-[var(--surface)] p-4">
      {editingResult ? (
        <RenameGroupResultDialog
          isSubmitting={isSubmitting}
          name={editedName}
          onCancel={() => setEditingResult(null)}
          onChange={setEditedName}
          onSubmit={() => void renameResult()}
        />
      ) : null}
      {deletingResult ? (
        <DeleteGroupResultDialog
          isSubmitting={isSubmitting}
          name={deletingResult.name}
          onCancel={() => setDeletingResult(null)}
          onSubmit={() => void deleteResult()}
        />
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--muted)]">{ROSTER_BOARD.project}</p>
          <h1 className="mt-1 text-lg font-semibold">{projectTitle}</h1>
        </div>
        <Link
          className="flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
          href={rosterProjectRoute(projectId)}
        >
          <ListPlus size={16} />
          {ROSTER_BOARD.newGroupResult}
        </Link>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium">{ROSTER_BOARD.groupResults}</p>
        <nav
          aria-label={ROSTER_BOARD.groupResults}
          className="mt-2 flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            className={`${navigationClass(!selectedGroupResultId)} px-3 py-2`}
            href={rosterProjectRoute(projectId)}
          >
            {ROSTER_BOARD.baseRoster}
          </Link>
          {groupResults.map((result) => {
            const isActive = result.id === selectedGroupResultId;

            return (
              <div className={`flex items-center ${navigationClass(isActive)}`} key={result.id}>
                <Link
                  className="max-w-48 truncate px-3 py-2"
                  href={projectGroupResultRoute(projectId, result.id)}
                >
                  {result.name}
                </Link>
                <button
                  aria-label={ROSTER_BOARD.renameGroupResultLabel(result.name)}
                  className="flex size-8 items-center justify-center hover:opacity-70"
                  onClick={() => openRenameDialog(result)}
                  title={ROSTER_BOARD.renameGroupResult}
                  type="button"
                >
                  <Pencil size={14} />
                </button>
                <button
                  aria-label={ROSTER_BOARD.deleteGroupResultLabel(result.name)}
                  className="flex size-8 items-center justify-center hover:opacity-70"
                  onClick={() => openDeleteDialog(result)}
                  title={ROSTER_BOARD.deleteGroupResult}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </nav>
        {groupResults.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--muted)]">{ROSTER_BOARD.noGroupResults}</p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
