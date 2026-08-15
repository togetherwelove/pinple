"use client";

import { Download, Upload } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import {
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_BOARD,
  ROSTER_INPUT_ROWS,
  UI_LABELS,
  UI_MESSAGES,
} from "@/lib/config/app";
import { RosterExportDialog } from "@/components/dashboard/roster-export-dialog";
import { Spinner } from "@/components/spinner";
import { parseRosterText } from "@/lib/roster/parse-roster";
import { readRosterFile } from "@/lib/roster/read-roster-file";
import type { PersonInput } from "@/lib/types/domain";

type RosterBoardInputProps = {
  canExport: boolean;
  onAddPeople: (people: PersonInput[]) => void;
  onError: (message: string) => void;
  onExport: (title: string) => void;
};

export function RosterBoardInput({
  canExport,
  onAddPeople,
  onError,
  onExport,
}: RosterBoardInputProps) {
  const [input, setInput] = useState("");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
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
          className="min-h-9 min-w-0 flex-1 resize-y border border-[var(--border)] px-3 py-2 text-sm"
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
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <label
          aria-busy={isImporting}
          className={`flex w-fit items-center gap-1.5 px-2 py-1.5 text-sm ${isImporting ? "cursor-not-allowed text-[var(--muted)]" : "cursor-pointer hover:bg-[var(--canvas)]"}`}
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
        <button
          className={`flex items-center gap-1.5 px-2 py-1.5 text-sm ${canExport ? "hover:bg-[var(--canvas)]" : "cursor-not-allowed text-[var(--muted)]"}`}
          disabled={!canExport}
          onClick={() => setIsExportDialogOpen(true)}
          type="button"
        >
          <Download size={15} />
          {ROSTER_BOARD.exportRoster}
        </button>
      </div>
      {isExportDialogOpen ? (
        <RosterExportDialog
          onCancel={() => setIsExportDialogOpen(false)}
          onConfirm={(title) => {
            onExport(title);
            setIsExportDialogOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}
