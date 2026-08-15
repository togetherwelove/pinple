import { appointLeaders } from "@/lib/grouping/leader-assignment";
import { distributePeople } from "@/lib/grouping/distribute-people";
import { formatGroupName } from "@/lib/config/app";
import { allBoardPeople } from "@/lib/roster-board/draft";
import type {
  GroupResultMembers,
  RosterBoardDraft,
} from "@/lib/types/domain";

export function createBalancedGroupSizes(totalPeople: number, groupCount: number) {
  if (groupCount === 0) {
    return [];
  }

  const baseSize = Math.floor(totalPeople / groupCount);
  const remainder = totalPeople % groupCount;

  return Array.from(
    { length: groupCount },
    (_, index) => baseSize + (index < remainder ? 1 : 0),
  );
}

export function createGroupingPlan(draft: RosterBoardDraft, groupCount: number) {
  return {
    groupSizes: createBalancedGroupSizes(
      allBoardPeople(draft).length,
      groupCount,
    ),
  };
}

function createTargetGroups(draft: RosterBoardDraft, groupCount: number) {
  return Array.from({ length: groupCount }, (_, index) =>
    draft.groups[index] ?? {
      id: crypto.randomUUID(),
      members: [],
      name: formatGroupName(index),
      targetSize: 1,
    },
  );
}

export function createGroupedDraft(
  draft: RosterBoardDraft,
  groupCount: number,
): RosterBoardDraft {
  const people = allBoardPeople(draft);
  const { groupSizes } = createGroupingPlan(draft, groupCount);
  const distributedGroups = distributePeople(people, groupSizes);
  const targetGroups = createTargetGroups(draft, groupCount);
  const groups = distributedGroups.map((group, index) => ({
    ...targetGroups[index],
    members: group.members,
    targetSize: groupSizes[index],
  }));

  return {
    ...draft,
    groups: appointLeaders(groups, draft.leaderSelectionMode),
    unassigned: [],
  };
}

export function createGroupResultMembers(
  draft: RosterBoardDraft,
): GroupResultMembers {
  return {
    groups: draft.groups,
    leaderSelectionMode: draft.leaderSelectionMode,
    unassigned: draft.unassigned,
  };
}
