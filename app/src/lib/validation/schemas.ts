import { z } from "zod";
import {
  GROUPING_LIMITS,
  LEADER_SELECTION_MODES,
  VALIDATION_MESSAGES,
} from "@/lib/config/app";

const groupMemberSchema = z.object({
  id: z.string().uuid(),
  isLeader: z.boolean().optional(),
  name: z.string().trim().min(1),
});

const groupSchema = z
  .object({
    id: z.string().min(1),
    members: z.array(groupMemberSchema),
    name: z.string().trim().min(1).max(GROUPING_LIMITS.groupNameMaximumLength),
    targetSize: z.number().int().min(GROUPING_LIMITS.minimumPeoplePerGroup),
  })
  .superRefine((group, context) => {
    if (group.members.filter((member) => member.isLeader).length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.groupLeaderLimit,
      });
    }
  });

const groupResultMembersSchema = z.object({
  groups: z.array(groupSchema),
  leaderSelectionMode: z
    .enum([LEADER_SELECTION_MODES.none, LEADER_SELECTION_MODES.random])
    .optional(),
  unassigned: z.array(groupMemberSchema).optional(),
});

const boardPersonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
});

export const boardSnapshotSchema = z
  .object({
    members: groupResultMembersSchema,
    people: z.array(boardPersonSchema),
  })
  .superRefine((snapshot, context) => {
    const peopleIds = new Set(snapshot.people.map((person) => person.id));
    const referencedIds = [
      ...snapshot.members.groups.flatMap((group) =>
        group.members.map((member) => member.id),
      ),
      ...(snapshot.members.unassigned ?? []).map((member) => member.id),
    ];

    if (peopleIds.size !== snapshot.people.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.duplicateBoardPersonIds,
      });
    }

    if (referencedIds.some((id) => !peopleIds.has(id))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.unknownGroupResultMember,
      });
    }

    if (new Set(referencedIds).size !== referencedIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.duplicateGroupResultMembers,
      });
    }
  });

export const saveGroupResultSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(GROUPING_LIMITS.groupResultNameMaximumLength),
  overwrite: z.boolean().optional().default(false),
  snapshot: boardSnapshotSchema,
});

export const groupResultIdSchema = z.string().uuid();
