import { GROUP_RESULT_NAME_PREFIX, UI_MESSAGES } from "@/lib/config/app";
import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { prisma } from "@/lib/prisma";
import { boardSnapshotSchema } from "@/lib/validation/schemas";

function createResultName() {
  const timestamp = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
  })
    .format(new Date())
    .replace(" ", "_")
    .replace(":", "-");

  return `${GROUP_RESULT_NAME_PREFIX}_${timestamp}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    await requireOwnedProject(projectId, user.id);
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

      return transaction.groupResult.create({
        data: {
          members: parsed.data.members,
          name: createResultName(),
          projectId,
        },
      });
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
