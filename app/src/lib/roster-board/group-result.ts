import { appointLeaders } from "@/lib/grouping/leader-assignment";
import { distributePeople } from "@/lib/grouping/distribute-people";
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

export function createGroupingPlan(draft: RosterBoardDraft) {
  return {
    groupSizes: createBalancedGroupSizes(
      allBoardPeople(draft).length,
      draft.groups.length,
    ),
  };
}

export function createGroupedDraft(draft: RosterBoardDraft): RosterBoardDraft {
  const people = allBoardPeople(draft);
  const { groupSizes } = createGroupingPlan(draft);
  const distributedGroups = distributePeople(people, groupSizes, draft.strategy);
  const groups = distributedGroups.map((group, index) => ({
    ...draft.groups[index],
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
    strategy: draft.strategy,
    unassigned: draft.unassigned,
  };
}
