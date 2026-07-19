"use client";

import { Upload } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import {
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  ROSTER_INPUT_ROWS,
  UI_LABELS,
  UI_MESSAGES,
} from "@/lib/config/app";
import { Spinner } from "@/components/spinner";
import { ProjectRosterImport } from "@/components/dashboard/project-roster-import";
import { parseRosterText } from "@/lib/roster/parse-roster";
import { readRosterFile } from "@/lib/roster/read-roster-file";
import type {
  PersonInput,
  ProjectImportSource,
  RosterImportMode,
} from "@/lib/types/domain";

type RosterBoardInputProps = {
  currentPeopleCount: number;
  onAddPeople: (people: PersonInput[]) => void;
  onError: (message: string) => void;
  onImportProject: (
    source: ProjectImportSource,
    mode: RosterImportMode,
  ) => Promise<void>;
  projectImportSources: ProjectImportSource[];
};

export function RosterBoardInput({
  currentPeopleCount,
  onAddPeople,
  onError,
  onImportProject,
  projectImportSources,
}: RosterBoardInputProps) {
  const [input, setInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const canAdd = input.trim().length > 0 && !isImporting;

  function addInput() {
    try {
      onAddPeople(parseRosterText(input));
      setInput("");
    } catch (error) {
      onError(error instanceof Error ? error.message : UI_MESSAGES.invalidInput);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();

    if (canAdd) {
      addInput();
    }
  }

  async function importFile(file: File) {
    setIsImporting(true);

    try {
      onAddPeople(parseRosterText(await readRosterFile(file)));
    } catch (error) {
      onError(error instanceof Error ? error.message : UI_MESSAGES.invalidFile);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="font-semibold">명단 입력</h2>
      <div className="mt-3 flex items-end gap-2">
        <textarea
          className="min-w-0 flex-1 resize-y border border-[var(--border)] px-3 py-2 text-sm"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={ROSTER_BOARD.inputPlaceholder}
          rows={ROSTER_INPUT_ROWS}
          value={input}
        />
        <button
          className={`px-3 py-2 text-sm ${canAdd ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
          disabled={!canAdd}
          onClick={addInput}
          type="button"
        >
          {ROSTER_BOARD.addPerson}
        </button>
      </div>
      <label
        aria-busy={isImporting}
        className={`mt-3 flex w-fit items-center gap-2 text-sm ${isImporting ? "cursor-not-allowed text-[var(--muted)]" : "cursor-pointer"}`}
      >
        <Upload size={16} />
        {isImporting ? <Spinner size="sm" /> : null}
        {isImporting ? UI_LABELS.loadingRosterFile : ROSTER_BOARD.fileImport}
        <input
          accept=".csv,.xls,.xlsx"
          className="hidden"
          disabled={isImporting}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void importFile(file);
            }

            event.target.value = "";
          }}
          type="file"
        />
      </label>
      <ProjectRosterImport
        currentPeopleCount={currentPeopleCount}
        onError={onError}
        onImport={onImportProject}
        sources={projectImportSources}
      />
    </section>
  );
}
