import { UI_MESSAGES } from "@/lib/config/app";
import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { prisma } from "@/lib/prisma";
import { boardSnapshotSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const project = await requireOwnedProject(projectId, user.id);
    const parsed = boardSnapshotSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json({ error: UI_MESSAGES.boardSnapshotInvalid }, { status: 400 });
    }

    const result = await prisma.$transaction(async (transaction) => {
      await transaction.person.deleteMany({ where: { projectId } });
      await transaction.person.createMany({
        data: parsed.data.people.map((person) => ({ ...person, projectId })),
      });
      await transaction.project.update({
        data: { updatedAt: new Date() },
        where: { id: projectId },
      });

      return transaction.groupResult.upsert({
        create: {
          members: parsed.data.members,
          name: project.title,
          projectId,
        },
        update: { members: parsed.data.members, name: project.title },
        where: { projectId },
      });
    });

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
