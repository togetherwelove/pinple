import * as XLSX from "xlsx";
import { EXCEL_EXPORT } from "@/lib/config/app";
import type { PersonInput } from "@/lib/types/domain";

type RosterExportPerson = PersonInput & { id: string };

const INVALID_FILE_NAME_CHARACTER_PATTERN = /[<>:"/\\|?*\u0000-\u001F]/g;

function safeFileTitle(title: string) {
  const normalizedTitle = title
    .replace(INVALID_FILE_NAME_CHARACTER_PATTERN, "_")
    .trim()
    .replace(/[. ]+$/g, "");

  return normalizedTitle || EXCEL_EXPORT.rosterSheetName;
}

export function createRosterImportRows(people: RosterExportPerson[]) {
  return people.map((person) => [person.name]);
}

export function exportRosterToExcel(people: RosterExportPerson[], rosterTitle: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(createRosterImportRows(people));

  XLSX.utils.book_append_sheet(workbook, worksheet, EXCEL_EXPORT.rosterSheetName);
  XLSX.writeFile(
    workbook,
    `${safeFileTitle(rosterTitle)}_${EXCEL_EXPORT.rosterFileNameSuffix}.xlsx`,
  );
}
