import { GENDER, ROSTER_IMPORT_MODES, UI_MESSAGES } from "@/lib/config/app";
import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  createImportedRoster,
  mergeProjectRoster,
  rosterMembers,
} from "@/lib/roster/merge-project-roster";
import type { PersonInput } from "@/lib/types/domain";
import {
  groupResultMembersSchema,
  rosterImportSchema,
} from "@/lib/validation/schemas";

type ProjectRoster = {
  groupResult: { id: string; members: unknown } | null;
  people: Array<{ age: number | null; gender: string; name: string }>;
};

function storedPersonInput(
  person: ProjectRoster["people"][number],
): PersonInput {
  const gender =
    person.gender === GENDER.male || person.gender === GENDER.female
      ? person.gender
      : GENDER.unknown;

  return { age: person.age, gender, name: person.name };
}

function projectRosterMembers(project: ProjectRoster) {
  const parsedResult = groupResultMembersSchema.safeParse(project.groupResult?.members);

  if (parsedResult.success) {
    return parsedResult.data;
  }

  return createImportedRoster(project.people.map(storedPersonInput));
}

function peopleForImport(project: ProjectRoster) {
  return rosterMembers(projectRosterMembers(project)).map(({ age, gender, name }) => ({
    age,
    gender,
    name,
  }));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = rosterImportSchema.safeParse(await request.json());

    if (!parsed.success || parsed.data.sourceProjectId === projectId) {
      return Response.json({ error: UI_MESSAGES.rosterImportInvalid }, { status: 400 });
    }

    const [targetProject, sourceProject] = await Promise.all([
      prisma.project.findFirst({
        include: { groupResult: true, people: { orderBy: { createdAt: "asc" } } },
        where: { id: projectId, userId: user.id },
      }),
      prisma.project.findFirst({
        include: { groupResult: true, people: { orderBy: { createdAt: "asc" } } },
        where: { id: parsed.data.sourceProjectId, userId: user.id },
      }),
    ]);

    if (!targetProject) {
      return Response.json(
        { error: UI_MESSAGES.rosterImportTargetNotFound },
        { status: 404 },
      );
    }

    if (!sourceProject) {
      return Response.json(
        { error: UI_MESSAGES.rosterImportSourceNotFound },
        { status: 404 },
      );
    }

    const importedPeople = peopleForImport(sourceProject);

    if (importedPeople.length === 0) {
      return Response.json({ error: UI_MESSAGES.noPeople }, { status: 400 });
    }

    const currentMembers = projectRosterMembers(targetProject);
    const members =
      parsed.data.mode === ROSTER_IMPORT_MODES.replace
        ? createImportedRoster(importedPeople)
        : mergeProjectRoster(currentMembers, importedPeople);
    const mergedPeople = rosterMembers(members);

    await prisma.$transaction(async (transaction) => {
      await transaction.person.deleteMany({ where: { projectId } });
      await transaction.person.createMany({
        data: mergedPeople.map(({ age, gender, id, name }) => ({
          age,
          gender,
          id,
          name,
          projectId,
        })),
      });

      if (parsed.data.mode === ROSTER_IMPORT_MODES.replace) {
        await transaction.groupResult.deleteMany({ where: { projectId } });
      } else if (targetProject.groupResult) {
        await transaction.groupResult.update({
          data: { members },
          where: { id: targetProject.groupResult.id },
        });
      }

      await transaction.project.update({
        data: { updatedAt: new Date() },
        where: { id: projectId },
      });
    });

    return Response.json({
      groupResultId:
        parsed.data.mode === ROSTER_IMPORT_MODES.merge
          ? targetProject.groupResult?.id ?? null
          : null,
      members,
      people: mergedPeople,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
