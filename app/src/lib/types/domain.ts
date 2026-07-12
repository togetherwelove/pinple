import type { GENDER, GROUPING_STRATEGIES } from "@/lib/config/app";

export type StoredGender = (typeof GENDER)[keyof typeof GENDER];

export type GroupingStrategy =
  (typeof GROUPING_STRATEGIES)[keyof typeof GROUPING_STRATEGIES];

export type PersonInput = {
  age: number;
  gender: StoredGender;
  name: string;
};

export type GroupMember = PersonInput & {
  id: string;
};

export type Group = {
  id: string;
  members: GroupMember[];
  name: string;
  targetSize: number;
};

export type GroupResultMembers = {
  groups: Group[];
  strategy?: GroupingStrategy;
};
