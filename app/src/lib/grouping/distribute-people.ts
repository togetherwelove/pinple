import { GROUP_NAME_PREFIX } from "@/lib/config/app";
import type { Group, GroupMember } from "@/lib/types/domain";

type GroupingPerson = GroupMember;

function compareByAgeAndName(left: GroupingPerson, right: GroupingPerson) {
  return left.age - right.age || left.name.localeCompare(right.name);
}

function createSnakeSlots(groupSizes: number[]) {
  const slots: number[] = [];
  const maximumGroupSize = Math.max(...groupSizes);

  for (let row = 0; row < maximumGroupSize; row += 1) {
    const indices = groupSizes.map((_, index) => index);
    const orderedIndices = row % 2 === 0 ? indices : indices.reverse();

    orderedIndices.forEach((groupIndex) => {
      if (groupSizes[groupIndex] > row) {
        slots.push(groupIndex);
      }
    });
  }

  return slots;
}

export function distributePeople(people: GroupingPerson[], groupSizes: number[]) {
  const assignedCount = groupSizes.reduce((sum, size) => sum + size, 0);

  if (assignedCount !== people.length) {
    throw new Error("Group capacity must match people count.");
  }

  const groups: Group[] = groupSizes.map((targetSize, index) => ({
    id: `group-${index + 1}`,
    members: [],
    name: `${GROUP_NAME_PREFIX} ${index + 1}`,
    targetSize,
  }));
  const slots = createSnakeSlots(groupSizes);
  const peopleByGender = ["M", "F"] as const;

  peopleByGender.forEach((gender) => {
    people
      .filter((person) => person.gender === gender)
      .sort(compareByAgeAndName)
      .forEach((person) => {
        const groupIndex = slots.shift();

        if (groupIndex === undefined) {
          throw new Error("No remaining group capacity.");
        }

        groups[groupIndex].members.push(person);
      });
  });

  return groups;
}
