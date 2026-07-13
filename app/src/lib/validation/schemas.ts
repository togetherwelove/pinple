import { z } from "zod";
import {
  GROUPING_LIMITS,
  GROUPING_STRATEGIES,
  GENDER,
  INPUT_GENDER,
  LEADER_SELECTION_MODES,
} from "@/lib/config/app";

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(GROUPING_LIMITS.projectTitleMaximumLength),
});

export const personInputSchema = z.object({
  age: z.coerce.number().int().min(GROUPING_LIMITS.minimumAge).nullable(),
  gender: z.enum([
    GENDER.male,
    GENDER.female,
    GENDER.unknown,
    ...INPUT_GENDER.male,
    ...INPUT_GENDER.female,
  ]),
  name: z.string().trim().min(1),
});

export const peopleRequestSchema = z.object({
  people: z.array(personInputSchema).min(1),
});

export const groupSizeSchema = z
  .array(z.coerce.number().int().min(GROUPING_LIMITS.minimumPeoplePerGroup))
  .min(GROUPING_LIMITS.minimumGroupCount)
  .max(GROUPING_LIMITS.maximumGroupCount);

export const groupingRequestSchema = z.object({
  groupSizes: groupSizeSchema,
  leaderSelectionMode: z
    .enum([
      LEADER_SELECTION_MODES.none,
      LEADER_SELECTION_MODES.random,
    ])
    .default(LEADER_SELECTION_MODES.none),
  strategy: z.enum([
    GROUPING_STRATEGIES.even,
    GROUPING_STRATEGIES.ageSimilar,
    GROUPING_STRATEGIES.genderAgeSimilar,
    GROUPING_STRATEGIES.genderSeparated,
  ]),
});

export const groupMemberSchema = z.object({
  age: z.number().int().min(GROUPING_LIMITS.minimumAge).nullable(),
  gender: z.enum([GENDER.male, GENDER.female, GENDER.unknown]),
  id: z.string().uuid(),
  isLeader: z.boolean().optional(),
  name: z.string().min(1),
});

const groupSchema = z
  .object({
      id: z.string().min(1),
      members: z.array(groupMemberSchema),
      name: z.string().min(1),
      targetSize: z.number().int().min(GROUPING_LIMITS.minimumPeoplePerGroup),
  })
  .superRefine((group, context) => {
    if (group.members.filter((member) => member.isLeader).length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A team can have at most one leader.",
      });
    }
  });

export const groupResultMembersSchema = z.object({
  groups: z.array(groupSchema),
  strategy: z
    .enum([
      GROUPING_STRATEGIES.even,
      GROUPING_STRATEGIES.ageSimilar,
      GROUPING_STRATEGIES.genderAgeSimilar,
      GROUPING_STRATEGIES.genderSeparated,
    ])
    .optional(),
});

export const boardPersonSchema = z.object({
  age: z.coerce.number().int().min(GROUPING_LIMITS.minimumAge).nullable(),
  gender: z.enum([GENDER.male, GENDER.female, GENDER.unknown]),
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
    const referencedIds = snapshot.members.groups.flatMap((group) =>
      group.members.map((member) => member.id),
    );

    if (peopleIds.size !== snapshot.people.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate person ids are not allowed.",
      });
    }

    if (referencedIds.some((id) => !peopleIds.has(id))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Group members must exist in the roster.",
      });
    }
  });
