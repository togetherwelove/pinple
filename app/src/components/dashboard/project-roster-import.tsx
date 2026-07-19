"use client";

import { FolderInput } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import {
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_IMPORT,
  ROSTER_IMPORT_MODES,
  UI_LABELS,
  UI_MESSAGES,
} from "@/lib/config/app";
import type {
  ProjectImportSource,
  RosterImportMode,
} from "@/lib/types/domain";

type ProjectRosterImportProps = {
  currentPeopleCount: number;
  onError: (message: string) => void;
  onImport: (source: ProjectImportSource, mode: RosterImportMode) => Promise<void>;
  sources: ProjectImportSource[];
};

export function ProjectRosterImport({
  currentPeopleCount,
  onError,
  onImport,
  sources,
}: ProjectRosterImportProps) {
  const [isChoosingMode, setIsChoosingMode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const selectedSource = sources.find((source) => source.id === sourceId);
  const canImport = Boolean(selectedSource) && !isImporting;

  async function importRoster(mode: RosterImportMode) {
    if (!selectedSource) {
      return;
    }

    setIsImporting(true);

    try {
      await onImport(selectedSource, mode);
      setIsChoosingMode(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : UI_MESSAGES.rosterImportFailed);
    } finally {
      setIsImporting(false);
    }
  }

  function startImport() {
    if (!selectedSource) {
      return;
    }

    if (currentPeopleCount > 0) {
      setIsChoosingMode(true);
      return;
    }

    void importRoster(ROSTER_IMPORT_MODES.replace);
  }

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      {isChoosingMode ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
          role="dialog"
        >
          <section className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
            <h2 className="font-semibold">{ROSTER_IMPORT.dialogTitle}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {ROSTER_IMPORT.dialogDescription}
            </p>
            <div className="mt-5 grid gap-2">
              <button
                className="border border-[var(--border)] p-3 text-left hover:bg-[var(--canvas)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isImporting}
                onClick={() => void importRoster(ROSTER_IMPORT_MODES.replace)}
                type="button"
              >
                <strong className="block text-sm">{ROSTER_IMPORT.replace}</strong>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {ROSTER_IMPORT.replaceDescription}
                </span>
              </button>
              <button
                className="border border-[var(--border)] p-3 text-left hover:bg-[var(--canvas)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isImporting}
                onClick={() => void importRoster(ROSTER_IMPORT_MODES.merge)}
                type="button"
              >
                <strong className="block text-sm">{ROSTER_IMPORT.merge}</strong>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {ROSTER_IMPORT.mergeDescription}
                </span>
              </button>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              {isImporting ? (
                <span className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Spinner size="sm" />
                  {ROSTER_IMPORT.loading}
                </span>
              ) : null}
              <button
                className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
                disabled={isImporting}
                onClick={() => setIsChoosingMode(false)}
                type="button"
              >
                {UI_LABELS.cancel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <label className="block text-sm font-medium">
        {ROSTER_IMPORT.chooseProject}
        <select
          className="mt-2 w-full border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm"
          disabled={sources.length === 0 || isImporting}
          onChange={(event) => setSourceId(event.target.value)}
          value={sourceId}
        >
          <option value="">{ROSTER_IMPORT.selectPlaceholder}</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.title}
            </option>
          ))}
        </select>
      </label>
      <button
        className={`mt-2 flex w-full items-center justify-center gap-2 px-3 py-2 text-sm ${canImport ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
        disabled={!canImport}
        onClick={startImport}
        type="button"
      >
        {isImporting ? <Spinner size="sm" /> : <FolderInput size={16} />}
        {isImporting ? ROSTER_IMPORT.loading : ROSTER_IMPORT.action}
      </button>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {sources.length === 0 ? ROSTER_IMPORT.emptyProjects : ROSTER_IMPORT.description}
      </p>
    </div>
  );
}
