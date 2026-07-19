import {
  ROSTER_BOARD_DND_IDS,
  formatGroupName,
} from "@/lib/config/app";
import type { Group, GroupMember, RosterBoardDraft } from "@/lib/types/domain";

export const UNASSIGNED_COLUMN_ID = ROSTER_BOARD_DND_IDS.unassigned;
export const NEW_GROUP_COLUMN_ID = ROSTER_BOARD_DND_IDS.newGroup;

type MemberLocation = {
  groupId: string | null;
  index: number;
  member: GroupMember;
};

export function groupOrderItemId(groupId: string) {
  return `${ROSTER_BOARD_DND_IDS.groupOrderPrefix}${groupId}`;
}

export function groupIdFromOrderItemId(itemId: string) {
  return itemId.startsWith(ROSTER_BOARD_DND_IDS.groupOrderPrefix)
    ? itemId.slice(ROSTER_BOARD_DND_IDS.groupOrderPrefix.length)
    : null;
}

function findMemberLocation(
  draft: RosterBoardDraft,
  memberId: string,
): MemberLocation | null {
  const unassignedIndex = draft.unassigned.findIndex(
    (member) => member.id === memberId,
  );

  if (unassignedIndex >= 0) {
    return {
      groupId: null,
      index: unassignedIndex,
      member: draft.unassigned[unassignedIndex],
    };
  }

  for (const group of draft.groups) {
    const memberIndex = group.members.findIndex((member) => member.id === memberId);

    if (memberIndex >= 0) {
      return {
        groupId: group.id,
        index: memberIndex,
        member: group.members[memberIndex],
      };
    }
  }

  return null;
}

function findTargetLocation(draft: RosterBoardDraft, targetId: string) {
  if (targetId === UNASSIGNED_COLUMN_ID) {
    return { groupId: null, index: draft.unassigned.length };
  }

  const orderedGroupId = groupIdFromOrderItemId(targetId);
  const group = draft.groups.find(
    (item) => item.id === (orderedGroupId ?? targetId),
  );

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

function nextAvailableGroupName(groups: Group[]) {
  let index = 0;

  while (groups.some((group) => group.name === formatGroupName(index))) {
    index += 1;
  }

  return formatGroupName(index);
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

  return {
    ...draft,
    groups: groups.filter((group) => group.members.length > 0),
    unassigned,
  };
}

export function moveMemberToNewGroup(
  draft: RosterBoardDraft,
  memberId: string,
  newGroupId: string,
): RosterBoardDraft | null {
  const source = findMemberLocation(draft, memberId);

  if (!source) {
    return null;
  }

  const unassigned = [...draft.unassigned];
  const groups = cloneGroups(draft.groups);
  removeMember(unassigned, groups, source);
  const nonEmptyGroups = groups.filter((group) => group.members.length > 0);

  return {
    ...draft,
    groups: [
      ...nonEmptyGroups,
      {
        id: newGroupId,
        members: [source.member],
        name: nextAvailableGroupName(nonEmptyGroups),
        targetSize: 1,
      },
    ],
    unassigned,
  };
}

function targetGroupId(draft: RosterBoardDraft, targetId: string) {
  const orderedGroupId = groupIdFromOrderItemId(targetId);

  if (orderedGroupId) {
    return orderedGroupId;
  }

  if (draft.groups.some((group) => group.id === targetId)) {
    return targetId;
  }

  return findMemberLocation(draft, targetId)?.groupId ?? null;
}

export function reorderBoardGroups(
  draft: RosterBoardDraft,
  activeItemId: string,
  targetId: string,
): RosterBoardDraft | null {
  const activeGroupId = groupIdFromOrderItemId(activeItemId);

  if (!activeGroupId) {
    return null;
  }

  const sourceIndex = draft.groups.findIndex((group) => group.id === activeGroupId);
  const resolvedTargetGroupId = targetGroupId(draft, targetId);
  const destinationIndex =
    targetId === NEW_GROUP_COLUMN_ID
      ? draft.groups.length - 1
      : draft.groups.findIndex((group) => group.id === resolvedTargetGroupId);

  if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) {
    return null;
  }

  const groups = [...draft.groups];
  const [movedGroup] = groups.splice(sourceIndex, 1);
  groups.splice(destinationIndex, 0, movedGroup);

  return { ...draft, groups };
}
