import * as XLSX from "xlsx";
import { UI_MESSAGES } from "@/lib/config/app";

const CSV_FILE_EXTENSION = ".csv";
const KOREAN_CSV_ENCODING = "euc-kr";
const UTF8_ENCODING = "utf-8";

function isCsvFile(file: File) {
  return file.name.toLowerCase().endsWith(CSV_FILE_EXTENSION);
}

function decodeCsv(buffer: ArrayBuffer) {
  try {
    return new TextDecoder(UTF8_ENCODING, { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder(KOREAN_CSV_ENCODING, { fatal: true }).decode(buffer);
  }
}

export async function readRosterFile(file: File) {
  const buffer = await file.arrayBuffer();
  const source = isCsvFile(file) ? decodeCsv(buffer) : buffer;
  const workbook = XLSX.read(source, { type: isCsvFile(file) ? "string" : "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error(UI_MESSAGES.emptyWorkbook);
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 });

  return rows
    .filter((row) => row.length >= 3)
    .map((row) => row.slice(0, 3).join(", "))
    .join("\n");
}
