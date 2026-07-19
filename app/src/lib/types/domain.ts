import type {
  GENDER,
  GROUPING_STRATEGIES,
  LEADER_SELECTION_MODES,
} from "@/lib/config/app";

export type StoredGender = (typeof GENDER)[keyof typeof GENDER];

export type GroupingStrategy =
  (typeof GROUPING_STRATEGIES)[keyof typeof GROUPING_STRATEGIES];

export type LeaderSelectionMode =
  (typeof LEADER_SELECTION_MODES)[keyof typeof LEADER_SELECTION_MODES];

export type PersonInput = {
  age: number | null;
  gender: StoredGender;
  name: string;
};

export type GroupMember = PersonInput & {
  id: string;
  isLeader?: boolean;
};

export type Group = {
  id: string;
  members: GroupMember[];
  name: string;
  targetSize: number;
};

export type GroupResultMembers = {
  groups: Group[];
  leaderSelectionMode?: LeaderSelectionMode;
  strategy?: GroupingStrategy;
  unassigned?: GroupMember[];
};

export type GroupResultSummary = {
  createdAt: string;
  id: string;
  name: string;
};

export type GroupResultDetail = GroupResultSummary & {
  members: GroupResultMembers;
};

export type RosterBoardDraft = {
  groups: Group[];
  leaderSelectionMode: LeaderSelectionMode;
  strategy: GroupingStrategy;
  unassigned: GroupMember[];
};
