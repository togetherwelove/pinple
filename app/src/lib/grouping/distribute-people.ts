import {
  GENDER,
  GROUP_NAME_PREFIX,
  GROUPING_STRATEGIES,
} from "@/lib/config/app";
import { shuffle } from "@/lib/grouping/shuffle";
import type {
  Group,
  GroupMember,
  GroupingStrategy,
  StoredGender,
} from "@/lib/types/domain";

type GroupingPerson = GroupMember;

type GenderOrder = readonly [StoredGender, StoredGender];

function createGroups(groupSizes: number[]): Group[] {
  return groupSizes.map((targetSize, index) => ({
    id: `group-${index + 1}`,
    members: [],
    name: `${GROUP_NAME_PREFIX} ${index + 1}`,
    targetSize,
  }));
}

function sortByAgeWithShuffledPeers(people: GroupingPerson[]) {
  const peopleByAge = new Map<number, GroupingPerson[]>();

  people.forEach((person) => {
    const sameAgePeople = peopleByAge.get(person.age) ?? [];
    sameAgePeople.push(person);
    peopleByAge.set(person.age, sameAgePeople);
  });

  return [...peopleByAge.entries()]
    .sort(([leftAge], [rightAge]) => leftAge - rightAge)
    .flatMap(([, sameAgePeople]) => shuffle(sameAgePeople));
}

function createRandomSnakeSlots(groupSizes: number[]) {
  const slots: number[] = [];
  const maximumGroupSize = Math.max(...groupSizes);

  for (let row = 0; row < maximumGroupSize; row += 1) {
    const indices = groupSizes
      .map((size, index) => ({ index, size }))
      .filter(({ size }) => size > row)
      .map(({ index }) => index);
    const rowDirection = row % 2 === 0 ? indices : [...indices].reverse();

    slots.push(...shuffle(rowDirection));
  }

  return slots;
}

function assignEvenly(people: GroupingPerson[], groupSizes: number[]) {
  const groups = createGroups(groupSizes);
  const slots = createRandomSnakeSlots(groupSizes);
  const peopleByGender = [GENDER.male, GENDER.female] as const;

  peopleByGender.forEach((gender) => {
    sortByAgeWithShuffledPeers(people.filter((person) => person.gender === gender)).forEach(
      (person) => {
        const groupIndex = slots.shift();

        if (groupIndex === undefined) {
          throw new Error("No remaining group capacity.");
        }

        groups[groupIndex].members.push(person);
      },
    );
  });

  return groups;
}

function assignBySimilarAge(people: GroupingPerson[], groupSizes: number[]) {
  const sortedPeople = sortByAgeWithShuffledPeers(people);
  let personIndex = 0;

  return createGroups(groupSizes).map((group) => {
    const members = sortedPeople.slice(personIndex, personIndex + group.targetSize);
    personIndex += group.targetSize;

    return { ...group, members };
  });
}

function assignByGenderOrder(
  people: GroupingPerson[],
  groupSizes: number[],
  genderOrder: GenderOrder,
) {
  const peopleByGender = new Map<StoredGender, GroupingPerson[]>(
    genderOrder.map((gender) => [
      gender,
      sortByAgeWithShuffledPeers(people.filter((person) => person.gender === gender)),
    ]),
  );

  return createGroups(groupSizes).map((group) => {
    const members: GroupingPerson[] = [];

    genderOrder.forEach((gender) => {
      const remainingCapacity = group.targetSize - members.length;

      if (remainingCapacity > 0) {
        members.push(...(peopleByGender.get(gender)?.splice(0, remainingCapacity) ?? []));
      }
    });

    return { ...group, members };
  });
}

function scoreGenderSeparation(groups: Group[]) {
  return groups.reduce(
    (score, group) => {
      const genderCount = new Set(group.members.map((member) => member.gender)).size;
      const maleCount = group.members.filter((member) => member.gender === GENDER.male).length;
      const femaleCount = group.members.length - maleCount;

      return {
        mixedGroupCount: score.mixedGroupCount + (genderCount > 1 ? 1 : 0),
        minorityCount: score.minorityCount + (genderCount > 1 ? Math.min(maleCount, femaleCount) : 0),
      };
    },
    { mixedGroupCount: 0, minorityCount: 0 },
  );
}

function assignBySeparatedGender(people: GroupingPerson[], groupSizes: number[]) {
  const maleFirstGroups = assignByGenderOrder(people, groupSizes, [GENDER.male, GENDER.female]);
  const femaleFirstGroups = assignByGenderOrder(people, groupSizes, [GENDER.female, GENDER.male]);
  const maleFirstScore = scoreGenderSeparation(maleFirstGroups);
  const femaleFirstScore = scoreGenderSeparation(femaleFirstGroups);

  if (femaleFirstScore.mixedGroupCount < maleFirstScore.mixedGroupCount) {
    return femaleFirstGroups;
  }

  if (
    femaleFirstScore.mixedGroupCount === maleFirstScore.mixedGroupCount &&
    femaleFirstScore.minorityCount < maleFirstScore.minorityCount
  ) {
    return femaleFirstGroups;
  }

  return maleFirstGroups;
}

export function distributePeople(
  people: GroupingPerson[],
  groupSizes: number[],
  strategy: GroupingStrategy = GROUPING_STRATEGIES.even,
) {
  const assignedCount = groupSizes.reduce((sum, size) => sum + size, 0);

  if (assignedCount !== people.length) {
    throw new Error("Group capacity must match people count.");
  }

  if (strategy === GROUPING_STRATEGIES.ageSimilar) {
    return assignBySimilarAge(people, groupSizes);
  }

  if (strategy === GROUPING_STRATEGIES.genderSeparated) {
    return assignBySeparatedGender(people, groupSizes);
  }

  return assignEvenly(people, groupSizes);
}
