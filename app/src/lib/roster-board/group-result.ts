import { appointLeaders } from "@/lib/grouping/leader-assignment";
import { distributePeople } from "@/lib/grouping/distribute-people";
import { shuffle } from "@/lib/grouping/shuffle";
import {
  allBoardPeople,
  createEqualGroupSizes,
} from "@/lib/roster-board/draft";
import type {
  GroupResultMembers,
  RosterBoardDraft,
} from "@/lib/types/domain";

export function createGroupingPlan(draft: RosterBoardDraft) {
  const totalPeople = allBoardPeople(draft).length;
  const groupSizes = createEqualGroupSizes(totalPeople, draft.groupCount);
  const assignedCount = groupSizes.reduce((sum, size) => sum + size, 0);

  return {
    assignedCount,
    groupSizes,
    unassignedCount: Math.max(totalPeople - assignedCount, 0),
  };
}

export function createGroupedDraft(draft: RosterBoardDraft): RosterBoardDraft {
  const people = shuffle(allBoardPeople(draft));
  const { assignedCount, groupSizes } = createGroupingPlan(draft);
  const assignedPeople = people.slice(0, assignedCount);
  const unassigned = people.slice(assignedCount).map((person) => ({
    ...person,
    isLeader: false,
  }));

  return {
    ...draft,
    groups: appointLeaders(
      distributePeople(assignedPeople, groupSizes, draft.strategy),
      draft.leaderSelectionMode,
    ),
    unassigned,
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
