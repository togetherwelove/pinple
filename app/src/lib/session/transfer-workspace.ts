import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createTransferredResultName } from "@/lib/session/transferred-result-name";

export async function prepareAuthenticatedWorkspace(
  userId: string,
  anonymousWorkspaceId: string | null,
) {
  await prisma.$transaction(async (transaction) => {
    const authenticatedWorkspace = await transaction.workspace.findUnique({
      select: {
        groupResults: { select: { name: true } },
        id: true,
      },
      where: { id: userId },
    });
    const anonymousWorkspace =
      anonymousWorkspaceId && anonymousWorkspaceId !== userId
        ? await transaction.workspace.findUnique({
            select: {
              groupResults: {
                orderBy: { createdAt: "asc" },
                select: {
                  createdAt: true,
                  members: true,
                  name: true,
                  updatedAt: true,
                },
              },
              id: true,
              people: { select: { name: true } },
            },
            where: { id: anonymousWorkspaceId },
          })
        : null;

    if (!authenticatedWorkspace && anonymousWorkspace) {
      await transaction.workspace.update({
        data: { id: userId },
        where: { id: anonymousWorkspace.id },
      });
      return;
    }

    await transaction.workspace.upsert({
      create: { id: userId },
      update: {},
      where: { id: userId },
    });

    if (!anonymousWorkspace) {
      return;
    }

    if (anonymousWorkspace.people.length > 0) {
      await transaction.person.createMany({
        data: anonymousWorkspace.people.map((person) => ({
          name: person.name,
          workspaceId: userId,
        })),
        skipDuplicates: true,
      });
    }

    const existingNames = new Set(
      authenticatedWorkspace?.groupResults.map((result) => result.name),
    );

    for (const result of anonymousWorkspace.groupResults) {
      const name = createTransferredResultName(result.name, existingNames);

      await transaction.groupResult.create({
        data: {
          createdAt: result.createdAt,
          members: result.members as Prisma.InputJsonValue,
          name,
          updatedAt: result.updatedAt,
          workspaceId: userId,
        },
      });
      existingNames.add(name);
    }

    await transaction.workspace.delete({
      where: { id: anonymousWorkspace.id },
    });
  });
}
