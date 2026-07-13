import * as XLSX from "xlsx";
import { EXCEL_EXPORT, GENDER, GENDER_LABELS } from "@/lib/config/app";
import type { PersonInput } from "@/lib/types/domain";

type RosterExportPerson = PersonInput & { id: string };

export function createRosterImportRows(people: RosterExportPerson[]) {
  return people.map((person) => [
    person.name,
    person.gender === GENDER.unknown ? "" : GENDER_LABELS[person.gender],
    person.age ?? "",
  ]);
}

export function exportRosterToExcel(people: RosterExportPerson[], rosterTitle: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(createRosterImportRows(people));

  XLSX.utils.book_append_sheet(workbook, worksheet, EXCEL_EXPORT.rosterSheetName);
  XLSX.writeFile(
    workbook,
    `${rosterTitle}_${EXCEL_EXPORT.rosterFileNameSuffix}.xlsx`,
  );
}
