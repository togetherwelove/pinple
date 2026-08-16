import * as XLSX from "xlsx";
import { EXCEL_EXPORT, displayGroupName } from "@/lib/config/app";
import { safeExportFileTitle } from "@/lib/roster/export-file-name";
import type { Group } from "@/lib/types/domain";

function createReadableSheet(groups: Group[]) {
  const headers = groups.map((group) => displayGroupName(group.name));
  const maximumMemberCount = Math.max(
    ...groups.map((group) => group.members.length),
    0,
  );
  const memberRows = Array.from({ length: maximumMemberCount }, (_, index) =>
    groups.map((group) => group.members[index]?.name ?? ""),
  );
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...memberRows]);

  worksheet["!cols"] = groups.map((group, index) => ({
    wch: Math.max(
      EXCEL_EXPORT.minimumColumnWidth,
      headers[index].length + EXCEL_EXPORT.columnWidthPadding,
      ...group.members.map(
        (member) => member.name.length + EXCEL_EXPORT.columnWidthPadding,
      ),
    ),
  }));

  return worksheet;
}

function createRawSheet(groups: Group[]) {
  return XLSX.utils.aoa_to_sheet([
    [EXCEL_EXPORT.groupNameHeader, EXCEL_EXPORT.memberNameHeader],
    ...groups.flatMap((group) =>
      group.members.map((member) => [displayGroupName(group.name), member.name]),
    ),
  ]);
}

export function exportGroupResultsToExcel(groups: Group[], fileTitle: string) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    createReadableSheet(groups),
    EXCEL_EXPORT.sheetName,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    createRawSheet(groups),
    EXCEL_EXPORT.rawSheetName,
  );
  XLSX.writeFile(
    workbook,
    `${safeExportFileTitle(fileTitle, EXCEL_EXPORT.groupResultFileTitle)}${EXCEL_EXPORT.fileExtension}`,
  );
}
