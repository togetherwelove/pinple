import { INPUT_GENDER } from "@/lib/config/app";

export type ParsedRosterPerson = {
  age: number;
  gender: (typeof INPUT_GENDER)[keyof typeof INPUT_GENDER][number];
  name: string;
};

const ROSTER_LINE_PATTERN = /^([^,]+?)\s*,\s*(남자|여자|남|여)\s*,\s*(\d+)\s*$/;

const ROSTER_MESSAGES = {
  empty: "명단을 입력해 주세요.",
  invalidLine: (lineNumber: number) => `${lineNumber}번째 줄의 형식이 올바르지 않습니다.`,
};

export function parseRosterText(text: string): ParsedRosterPerson[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error(ROSTER_MESSAGES.empty);
  }

  return lines.map((line, index) => {
    const match = ROSTER_LINE_PATTERN.exec(line);

    if (!match) {
      throw new Error(ROSTER_MESSAGES.invalidLine(index + 1));
    }

    return {
      age: Number(match[3]),
      gender: match[2] as ParsedRosterPerson["gender"],
      name: match[1].trim(),
    };
  });
}
