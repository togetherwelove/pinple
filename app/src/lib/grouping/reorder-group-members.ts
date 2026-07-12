import type { Group } from "@/lib/types/domain";

function findGroupIndexByMemberOrGroupId(groups: Group[], id: string) {
  return groups.findIndex(
    (group) => group.id === id || group.members.some((member) => member.id === id),
  );
}

function hasMemberLayoutChanged(previousGroups: Group[], nextGroups: Group[]) {
  return previousGroups.some(
    (group, groupIndex) =>
      group.members.length !== nextGroups[groupIndex].members.length ||
      group.members.some(
        (member, memberIndex) => member.id !== nextGroups[groupIndex].members[memberIndex].id,
      ),
  );
}

export function reorderGroupMembers(
  groups: Group[],
  memberId: string,
  targetId: string,
): Group[] | null {
  const sourceGroupIndex = findGroupIndexByMemberOrGroupId(groups, memberId);
  const targetGroupIndex = findGroupIndexByMemberOrGroupId(groups, targetId);

  if (sourceGroupIndex < 0 || targetGroupIndex < 0) {
    return null;
  }

  const sourceMemberIndex = groups[sourceGroupIndex].members.findIndex(
    (member) => member.id === memberId,
  );

  if (sourceMemberIndex < 0) {
    return null;
  }

  const nextGroups = groups.map((group) => ({
    ...group,
    members: [...group.members],
  }));
  const targetMemberIndex = nextGroups[targetGroupIndex].members.findIndex(
    (member) => member.id === targetId,
  );
  const targetPosition =
    targetMemberIndex < 0
      ? nextGroups[targetGroupIndex].members.length
      : targetMemberIndex;
  const [member] = nextGroups[sourceGroupIndex].members.splice(sourceMemberIndex, 1);

  nextGroups[targetGroupIndex].members.splice(targetPosition, 0, member);

  return hasMemberLayoutChanged(groups, nextGroups) ? nextGroups : null;
}
