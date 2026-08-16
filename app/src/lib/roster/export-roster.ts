import * as XLSX from "xlsx";
import { EXCEL_EXPORT } from "@/lib/config/app";
import { safeExportFileTitle } from "@/lib/roster/export-file-name";
import type { PersonInput } from "@/lib/types/domain";

type RosterExportPerson = PersonInput & { id: string };

export function createRosterImportRows(people: RosterExportPerson[]) {
  return people.map((person) => [person.name]);
}

export function exportRosterToExcel(people: RosterExportPerson[], rosterTitle: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(createRosterImportRows(people));

  XLSX.utils.book_append_sheet(workbook, worksheet, EXCEL_EXPORT.rosterSheetName);
  XLSX.writeFile(
    workbook,
    `${safeExportFileTitle(rosterTitle, EXCEL_EXPORT.rosterSheetName)}_${EXCEL_EXPORT.rosterFileNameSuffix}${EXCEL_EXPORT.fileExtension}`,
  );
}
