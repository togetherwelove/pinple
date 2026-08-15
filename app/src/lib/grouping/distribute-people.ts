import { formatGroupName } from "@/lib/config/app";
import { shuffle } from "@/lib/grouping/shuffle";
import type { Group, GroupMember } from "@/lib/types/domain";

type GroupingPerson = GroupMember;

function createGroups(groupSizes: number[]): Group[] {
  return groupSizes.map((targetSize, index) => ({
    id: `group-${index + 1}`,
    members: [],
    name: formatGroupName(index),
    targetSize,
  }));
}

function assignEvenly(people: GroupingPerson[], groupSizes: number[]) {
  const shuffledPeople = shuffle(people);
  let personIndex = 0;

  return createGroups(groupSizes).map((group) => {
    const members = shuffledPeople.slice(personIndex, personIndex + group.targetSize);
    personIndex += group.targetSize;

    return { ...group, members };
  });
}

export function distributePeople(
  people: GroupingPerson[],
  groupSizes: number[],
) {
  const assignedCount = groupSizes.reduce((sum, size) => sum + size, 0);

  if (assignedCount !== people.length) {
    throw new Error("Group capacity must match people count.");
  }

  return assignEvenly(people, groupSizes);
}
