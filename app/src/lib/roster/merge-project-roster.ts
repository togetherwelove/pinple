import { randomUUID } from "node:crypto";
import {
  LEADER_SELECTION_MODES,
  GROUPING_STRATEGIES,
} from "@/lib/config/app";
import type {
  GroupMember,
  GroupResultMembers,
  PersonInput,
} from "@/lib/types/domain";

function importedPeopleByName(people: PersonInput[]) {
  const peopleByName = new Map<string, PersonInput>();

  people.forEach((person) => peopleByName.set(person.name, person));

  return peopleByName;
}

function createImportedMember(person: PersonInput): GroupMember {
  return { ...person, id: randomUUID(), isLeader: false };
}

function mergeMember(
  member: GroupMember,
  importedPeople: Map<string, PersonInput>,
  retainedNames: Set<string>,
) {
  if (retainedNames.has(member.name)) {
    return null;
  }

  retainedNames.add(member.name);
  const importedPerson = importedPeople.get(member.name);

  return importedPerson ? { ...member, ...importedPerson } : member;
}

export function createImportedRoster(people: PersonInput[]): GroupResultMembers {
  return {
    groups: [],
    leaderSelectionMode: LEADER_SELECTION_MODES.none,
    strategy: GROUPING_STRATEGIES.even,
    unassigned: [...importedPeopleByName(people).values()].map(createImportedMember),
  };
}

export function mergeProjectRoster(
  current: GroupResultMembers,
  importedPeople: PersonInput[],
): GroupResultMembers {
  const importedPeopleMap = importedPeopleByName(importedPeople);
  const retainedNames = new Set<string>();
  const groups = current.groups
    .map((group) => ({
      ...group,
      members: group.members
        .map((member) => mergeMember(member, importedPeopleMap, retainedNames))
        .filter((member): member is GroupMember => member !== null),
    }))
    .filter((group) => group.members.length > 0);
  const unassigned = (current.unassigned ?? [])
    .map((member) => mergeMember(member, importedPeopleMap, retainedNames))
    .filter((member): member is GroupMember => member !== null);

  importedPeopleMap.forEach((person, name) => {
    if (!retainedNames.has(name)) {
      retainedNames.add(name);
      unassigned.push(createImportedMember(person));
    }
  });

  return { ...current, groups, unassigned };
}

export function rosterMembers(members: GroupResultMembers) {
  return [
    ...members.groups.flatMap((group) => group.members),
    ...(members.unassigned ?? []),
  ];
}
