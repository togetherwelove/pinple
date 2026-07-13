import {
  GROUPING_LIMITS,
  GROUPING_STRATEGIES,
  LEADER_SELECTION_MODES,
  formatGroupName,
} from "@/lib/config/app";
import type {
  Group,
  GroupMember,
  GroupResultMembers,
  PersonInput,
  RosterBoardDraft,
} from "@/lib/types/domain";

export type BoardPerson = PersonInput & { id: string };

function defaultGroupCount(totalPeople: number) {
  if (totalPeople === 0) {
    return GROUPING_LIMITS.minimumGroupCount;
  }

  return Math.min(
    Math.max(GROUPING_LIMITS.defaultGroupCount, GROUPING_LIMITS.minimumGroupCount),
    totalPeople,
  );
}

export function createDefaultGroupSizes(totalPeople: number, groupCount: number) {
  if (totalPeople === 0) {
    return Array.from({ length: groupCount }, () => GROUPING_LIMITS.minimumPeoplePerGroup);
  }

  const baseSize = Math.floor(totalPeople / groupCount);
  const remainder = totalPeople % groupCount;

  return Array.from(
    { length: groupCount },
    (_, index) => baseSize + (index < remainder ? 1 : 0),
  );
}

export function createGroupTemplates(groupSizes: number[]): Group[] {
  return groupSizes.map((targetSize, index) => ({
    id: `group-${index + 1}`,
    members: [],
    name: formatGroupName(index),
    targetSize,
  }));
}

function personIdentity(person: PersonInput) {
  return `${person.name}\u0000${person.gender}\u0000${person.age ?? "unknown-age"}`;
}

function uniqueMembers(people: GroupMember[]) {
  const peopleByIdentity = new Map<string, GroupMember>();

  people.forEach((person) => {
    peopleByIdentity.set(personIdentity(person), person);
  });

  return [...peopleByIdentity.values()];
}

function cloneGroups(groups: Group[]) {
  return groups.map((group) => ({
    ...group,
    members: group.members.map((member) => ({ ...member })),
  }));
}

export function createRosterBoardDraft(
  people: BoardPerson[],
  initialResult: GroupResultMembers | null,
): RosterBoardDraft {
  const savedGroups = initialResult?.groups ?? [];

  if (savedGroups.length === 0) {
    const groupCount = defaultGroupCount(people.length);

    return {
      groupCount,
      groups: createGroupTemplates(createDefaultGroupSizes(people.length, groupCount)),
      leaderSelectionMode: LEADER_SELECTION_MODES.none,
      strategy: GROUPING_STRATEGIES.even,
      unassigned: uniqueMembers(people.map((person) => ({ ...person }))),
    };
  }

  const groups = cloneGroups(savedGroups);
  const assignedIdentities = new Set(
    groups.flatMap((group) => group.members.map(personIdentity)),
  );
  const unassigned = people
    .filter((person) => !assignedIdentities.has(personIdentity(person)))
    .map((person) => ({ ...person }));

  return {
    groupCount: savedGroups.length,
    groups,
    leaderSelectionMode: LEADER_SELECTION_MODES.none,
    strategy: initialResult?.strategy ?? GROUPING_STRATEGIES.even,
    unassigned: uniqueMembers(unassigned),
  };
}

export function allBoardPeople(draft: RosterBoardDraft): BoardPerson[] {
  const peopleById = new Map<string, BoardPerson>();

  [...draft.unassigned, ...draft.groups.flatMap((group) => group.members)].forEach((person) => {
    peopleById.set(person.id, {
      age: person.age,
      gender: person.gender,
      id: person.id,
      name: person.name,
    });
  });

  return [...peopleById.values()];
}

export function addPeopleToDraft(
  draft: RosterBoardDraft,
  people: GroupMember[],
): RosterBoardDraft {
  return {
    ...draft,
    unassigned: uniqueMembers([...draft.unassigned, ...people]),
  };
}

export function updateUnassignedPerson(
  draft: RosterBoardDraft,
  personId: string,
  updates: PersonInput,
): RosterBoardDraft {
  return {
    ...draft,
    unassigned: draft.unassigned.map((person) =>
      person.id === personId ? { ...person, ...updates } : person,
    ),
  };
}

export function removePersonFromDraft(
  draft: RosterBoardDraft,
  personId: string,
  groupId: string | null,
): RosterBoardDraft {
  if (groupId !== null) {
    return {
      ...draft,
      groups: draft.groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const removedMember = group.members.find((member) => member.id === personId);
        const remainingMembers = group.members.filter((member) => member.id !== personId);

        return {
          ...group,
          members: removedMember?.isLeader
            ? remainingMembers.map((member) => ({ ...member, isLeader: false }))
            : remainingMembers,
        };
      }),
    };
  }

  return {
    ...draft,
    unassigned: draft.unassigned.filter((person) => person.id !== personId),
  };
}

export function updateGroupCount(draft: RosterBoardDraft, nextGroupCount: number): RosterBoardDraft {
  return {
    ...draft,
    groupCount: Math.min(
      Math.max(nextGroupCount, GROUPING_LIMITS.minimumGroupCount),
      GROUPING_LIMITS.maximumGroupCount,
    ),
  };
}
