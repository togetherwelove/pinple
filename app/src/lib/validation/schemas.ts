import { z } from "zod";
import { GROUPING_LIMITS, INPUT_GENDER } from "@/lib/config/app";

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(GROUPING_LIMITS.projectTitleMaximumLength),
});

export const personInputSchema = z.object({
  age: z.coerce.number().int().min(GROUPING_LIMITS.minimumAge),
  gender: z.enum([...INPUT_GENDER.male, ...INPUT_GENDER.female]),
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
});

export const groupMemberSchema = z.object({
  age: z.number().int().min(GROUPING_LIMITS.minimumAge),
  gender: z.enum(["M", "F"]),
  id: z.string().uuid(),
  name: z.string().min(1),
});

export const groupResultMembersSchema = z.object({
  groups: z.array(
    z.object({
      id: z.string().min(1),
      members: z.array(groupMemberSchema),
      name: z.string().min(1),
      targetSize: z.number().int().min(GROUPING_LIMITS.minimumPeoplePerGroup),
    }),
  ),
});
