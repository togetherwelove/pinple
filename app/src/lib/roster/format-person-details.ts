import { GENDER, GENDER_LABELS } from "@/lib/config/app";
import type { PersonInput } from "@/lib/types/domain";

export function formatPersonDetails(
  person: Pick<PersonInput, "age" | "gender">,
) {
  const details: string[] = [];

  if (person.gender !== GENDER.unknown) {
    details.push(GENDER_LABELS[person.gender]);
  }

  if (person.age !== null) {
    details.push(String(person.age));
  }

  return details.join(" · ");
}
