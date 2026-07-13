import {
  GENDER,
  formatGroupName,
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
    name: formatGroupName(index),
    targetSize,
  }));
}

function compareOptionalAges(leftAge: number | null, rightAge: number | null) {
  if (leftAge === null) {
    return rightAge === null ? 0 : 1;
  }

  if (rightAge === null) {
    return -1;
  }

  return leftAge - rightAge;
}

function sortByAgeWithShuffledPeers(people: GroupingPerson[]) {
  const peopleByAge = new Map<number | null, GroupingPerson[]>();

  people.forEach((person) => {
    const sameAgePeople = peopleByAge.get(person.age) ?? [];
    sameAgePeople.push(person);
    peopleByAge.set(person.age, sameAgePeople);
  });

  return [...peopleByAge.entries()]
    .sort(([leftAge], [rightAge]) => compareOptionalAges(leftAge, rightAge))
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

function copyGroups(groups: Group[]) {
  return groups.map((group) => ({
    ...group,
    members: [...group.members],
  }));
}

function assignToAvailableSlots(
  groups: Group[],
  people: GroupingPerson[],
  prioritizeAge: boolean,
) {
  const remainingGroupSizes = groups.map((group) => group.targetSize - group.members.length);
  const slots = createRandomSnakeSlots(remainingGroupSizes);
  const orderedPeople = prioritizeAge ? sortByAgeWithShuffledPeers(people) : shuffle(people);

  orderedPeople.forEach((person) => {
    const groupIndex = slots.shift();

    if (groupIndex === undefined) {
      throw new Error("No remaining group capacity.");
    }

    groups[groupIndex].members.push(person);
  });

  return groups;
}

function assignEvenly(people: GroupingPerson[], groupSizes: number[]) {
  const groups = createGroups(groupSizes);
  const slots = createRandomSnakeSlots(groupSizes);
  const peopleByGender = [GENDER.male, GENDER.female, GENDER.unknown] as const;

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
  groups: Group[],
  genderOrder: GenderOrder,
  prioritizeAge: boolean,
) {
  const peopleByGender = new Map<StoredGender, GroupingPerson[]>(
    genderOrder.map((gender) => [
      gender,
      prioritizeAge
        ? sortByAgeWithShuffledPeers(people.filter((person) => person.gender === gender))
        : shuffle(people.filter((person) => person.gender === gender)),
    ]),
  );

  return groups.map((group) => {
    const members = [...group.members];

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
      const maleCount = group.members.filter((member) => member.gender === GENDER.male).length;
      const femaleCount = group.members.filter((member) => member.gender === GENDER.female).length;
      const hasMixedKnownGenders = maleCount > 0 && femaleCount > 0;

      return {
        mixedGroupCount: score.mixedGroupCount + (hasMixedKnownGenders ? 1 : 0),
        minorityCount: score.minorityCount + (hasMixedKnownGenders ? Math.min(maleCount, femaleCount) : 0),
      };
    },
    { mixedGroupCount: 0, minorityCount: 0 },
  );
}

function assignBySeparatedGender(
  people: GroupingPerson[],
  groupSizes: number[],
  prioritizeAge: boolean,
) {
  const groupsWithUnknownPeople = assignToAvailableSlots(
    createGroups(groupSizes),
    people.filter((person) => person.gender === GENDER.unknown),
    prioritizeAge,
  );
  const maleFirstGroups = assignByGenderOrder(
    people,
    copyGroups(groupsWithUnknownPeople),
    [GENDER.male, GENDER.female],
    prioritizeAge,
  );
  const femaleFirstGroups = assignByGenderOrder(
    people,
    copyGroups(groupsWithUnknownPeople),
    [GENDER.female, GENDER.male],
    prioritizeAge,
  );
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
    return assignBySeparatedGender(people, groupSizes, false);
  }

  if (strategy === GROUPING_STRATEGIES.genderAgeSimilar) {
    return assignBySeparatedGender(people, groupSizes, true);
  }

  return assignEvenly(people, groupSizes);
}
