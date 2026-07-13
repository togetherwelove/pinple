import type { Group, GroupMember, RosterBoardDraft } from "@/lib/types/domain";

export const UNASSIGNED_COLUMN_ID = "unassigned";

type MemberLocation = {
  groupId: string | null;
  index: number;
  member: GroupMember;
};

function findMemberLocation(draft: RosterBoardDraft, memberId: string): MemberLocation | null {
  const unassignedIndex = draft.unassigned.findIndex((member) => member.id === memberId);

  if (unassignedIndex >= 0) {
    return { groupId: null, index: unassignedIndex, member: draft.unassigned[unassignedIndex] };
  }

  for (const group of draft.groups) {
    const memberIndex = group.members.findIndex((member) => member.id === memberId);

    if (memberIndex >= 0) {
      return { groupId: group.id, index: memberIndex, member: group.members[memberIndex] };
    }
  }

  return null;
}

function findTargetLocation(draft: RosterBoardDraft, targetId: string) {
  if (targetId === UNASSIGNED_COLUMN_ID) {
    return { groupId: null, index: draft.unassigned.length };
  }

  const group = draft.groups.find((item) => item.id === targetId);

  if (group) {
    return { groupId: group.id, index: group.members.length };
  }

  const member = findMemberLocation(draft, targetId);

  return member ? { groupId: member.groupId, index: member.index } : null;
}

function cloneGroups(groups: Group[]) {
  return groups.map((group) => ({ ...group, members: [...group.members] }));
}

function removeMember(
  unassigned: GroupMember[],
  groups: Group[],
  location: MemberLocation,
) {
  if (location.groupId === null) {
    unassigned.splice(location.index, 1);
    return;
  }

  const group = groups.find((item) => item.id === location.groupId);
  group?.members.splice(location.index, 1);
}

function insertMember(
  unassigned: GroupMember[],
  groups: Group[],
  groupId: string | null,
  index: number,
  member: GroupMember,
) {
  if (groupId === null) {
    unassigned.splice(index, 0, { ...member, isLeader: false });
    return;
  }

  const group = groups.find((item) => item.id === groupId);
  group?.members.splice(index, 0, member);
}

export function reorderBoardMembers(
  draft: RosterBoardDraft,
  memberId: string,
  targetId: string,
): RosterBoardDraft | null {
  const source = findMemberLocation(draft, memberId);
  const target = findTargetLocation(draft, targetId);

  if (!source || !target) {
    return null;
  }

  const unassigned = [...draft.unassigned];
  const groups = cloneGroups(draft.groups);
  const targetIndex =
    source.groupId === target.groupId && source.index < target.index
      ? target.index - 1
      : target.index;

  removeMember(unassigned, groups, source);
  insertMember(unassigned, groups, target.groupId, targetIndex, source.member);

  return { ...draft, groups, unassigned };
}
