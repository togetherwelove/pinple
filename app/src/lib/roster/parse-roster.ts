import { GENDER, ROSTER_PARSING } from "@/lib/config/app";
import type { PersonInput, StoredGender } from "@/lib/types/domain";

export type ParsedRosterPerson = PersonInput;

const GENDER_TOKEN_PATTERN = /(?:^|[\s,;|/\\()[\]{}_-]+)(남자|여자|남|여|M|F)(?=$|[\s,;|/\\()[\]{}_-]+)/gi;
const DECADE_AGE_PATTERN = /(?<!\d)(\d{2})\s*대(?!\d)/;
const AGE_PATTERN = /(?<!\d)(\d{2})(?!\d)/;
const NAME_SEPARATOR_PATTERN = /[\s,;|/\\()[\]{}_-]+/g;

function toStoredGender(value: string): StoredGender {
  const normalizedValue = value.toUpperCase();

  if (normalizedValue === "M" || value === "남" || value === "남자") {
    return GENDER.male;
  }

  if (normalizedValue === "F" || value === "여" || value === "여자") {
    return GENDER.female;
  }

  return GENDER.unknown;
}

function extractGender(line: string) {
  let gender = GENDER.unknown as StoredGender;

  const textWithoutGender = line.replace(GENDER_TOKEN_PATTERN, (matchedToken, token: string) => {
    gender = toStoredGender(token);
    return matchedToken.startsWith(" ") ? " " : "";
  });

  return { gender, textWithoutGender };
}

function extractAge(line: string) {
  const matchedAge = DECADE_AGE_PATTERN.exec(line) ?? AGE_PATTERN.exec(line);

  if (!matchedAge) {
    return { age: null, textWithoutAge: line };
  }

  return {
    age: Number(matchedAge[1]),
    textWithoutAge: line.replace(matchedAge[0], " "),
  };
}

function extractName(line: string, lineNumber: number) {
  const name = line.replace(NAME_SEPARATOR_PATTERN, " ").trim();

  return name || ROSTER_PARSING.autoName(lineNumber);
}

export function parseRosterText(text: string): ParsedRosterPerson[] {
  const lines = text
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => Boolean(line));

  if (lines.length === 0) {
    throw new Error(ROSTER_PARSING.empty);
  }

  return lines.map(({ line, lineNumber }) => {
    const { gender, textWithoutGender } = extractGender(line);
    const { age, textWithoutAge } = extractAge(textWithoutGender);

    return {
      age,
      gender,
      name: extractName(textWithoutAge, lineNumber),
    };
  });
}
