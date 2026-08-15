import { ROSTER_PARSING } from "@/lib/config/app";
import type { PersonInput } from "@/lib/types/domain";

export type ParsedRosterPerson = PersonInput;

export function parseRosterText(text: string): ParsedRosterPerson[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error(ROSTER_PARSING.empty);
  }

  return lines.map((name) => ({ name }));
}
