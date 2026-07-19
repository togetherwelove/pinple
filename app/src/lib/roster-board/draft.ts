import {
  GROUPING_STRATEGIES,
  LEADER_SELECTION_MODES,
  ROSTER_BOARD_DRAFT_KEY,
} from "@/lib/config/app";
import type {
  Group,
  GroupMember,
  GroupResultMembers,
  PersonInput,
  RosterBoardDraft,
} from "@/lib/types/domain";

export type BoardPerson = PersonInput & { id: string };

export function createBoardDraftKey(projectId: string, groupResultId?: string) {
  const scope = groupResultId ?? ROSTER_BOARD_DRAFT_KEY.rosterScope;

  return `${projectId}${ROSTER_BOARD_DRAFT_KEY.separator}${scope}`;
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

function cloneNonEmptyGroups(groups: Group[]) {
  return groups
    .filter((group) => group.members.length > 0)
    .map((group) => ({
      ...group,
      members: group.members.map((member) => ({ ...member })),
    }));
}

export function createRosterBoardDraft(
  people: BoardPerson[],
  initialResult: GroupResultMembers | null,
): RosterBoardDraft {
  const groups = cloneNonEmptyGroups(initialResult?.groups ?? []);
  const assignedIdentities = new Set(
    groups.flatMap((group) => group.members.map(personIdentity)),
  );
  const unassigned = initialResult?.unassigned
    ? initialResult.unassigned.map((person) => ({ ...person }))
    : people
        .filter((person) => !assignedIdentities.has(personIdentity(person)))
        .map((person) => ({ ...person }));

  return {
    groups,
    leaderSelectionMode:
      initialResult?.leaderSelectionMode ?? LEADER_SELECTION_MODES.none,
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
      groups: draft.groups
        .map((group) =>
          group.id === groupId
            ? {
                ...group,
                members: group.members.filter((member) => member.id !== personId),
              }
            : group,
        )
        .filter((group) => group.members.length > 0),
    };
  }

  return {
    ...draft,
    unassigned: draft.unassigned.filter((person) => person.id !== personId),
  };
}
