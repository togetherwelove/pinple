import type {
  LEADER_SELECTION_MODES,
} from "@/lib/config/app";

export type LeaderSelectionMode =
  (typeof LEADER_SELECTION_MODES)[keyof typeof LEADER_SELECTION_MODES];

export type PersonInput = {
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
  unassigned?: GroupMember[];
};

export type StoredGroupResult = {
  createdAt: string;
  id: string;
  members: GroupResultMembers;
  name: string;
  updatedAt: string;
};

export type RosterBoardDraft = {
  groups: Group[];
  leaderSelectionMode: LeaderSelectionMode;
  unassigned: GroupMember[];
};
