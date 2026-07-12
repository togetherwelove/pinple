import { LEADER_SELECTION_MODES } from "@/lib/config/app";
import { shuffle } from "@/lib/grouping/shuffle";
import type { Group, LeaderSelectionMode } from "@/lib/types/domain";

function copyGroups(groups: Group[]) {
  return groups.map((group) => ({
    ...group,
    members: group.members.map((member) => ({ ...member, isLeader: false })),
  }));
}

function selectLeaderId(group: Group, selectionMode: LeaderSelectionMode) {
  if (selectionMode === LEADER_SELECTION_MODES.none || group.members.length === 0) {
    return null;
  }

  if (selectionMode === LEADER_SELECTION_MODES.random) {
    return shuffle(group.members)[0].id;
  }

  const oldestAge = Math.max(...group.members.map((member) => member.age));
  const oldestMembers = group.members.filter((member) => member.age === oldestAge);

  return shuffle(oldestMembers)[0].id;
}

export function appointLeaders(groups: Group[], selectionMode: LeaderSelectionMode) {
  const groupsWithoutLeaders = copyGroups(groups);

  return groupsWithoutLeaders.map((group) => {
    const leaderId = selectLeaderId(group, selectionMode);

    return {
      ...group,
      members: group.members.map((member) => ({
        ...member,
        isLeader: member.id === leaderId,
      })),
    };
  });
}

export function setGroupLeader(
  groups: Group[],
  groupId: string,
  leaderId: string | null,
) {
  return groups.map((group) =>
    group.id === groupId
      ? {
          ...group,
          members: group.members.map((member) => ({
            ...member,
            isLeader: member.id === leaderId,
          })),
        }
      : group,
  );
}
