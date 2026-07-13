import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { prisma } from "@/lib/prisma";
import { groupResultUpdateSchema } from "@/lib/validation/schemas";
import { UI_MESSAGES } from "@/lib/config/app";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ groupResultId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { groupResultId } = await context.params;
    const groupResult = await prisma.groupResult.findUnique({
      where: { id: groupResultId },
    });

    if (!groupResult) {
      return Response.json({ error: UI_MESSAGES.groupResultNotFound }, { status: 404 });
    }

    await requireOwnedProject(groupResult.projectId, user.id);
    const parsed = groupResultUpdateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json({ error: UI_MESSAGES.groupResultInvalid }, { status: 400 });
    }

    const [result] = await prisma.$transaction([
      prisma.groupResult.update({
        data: parsed.data,
        where: { id: groupResultId },
      }),
      prisma.project.update({
        data: { updatedAt: new Date() },
        where: { id: groupResult.projectId },
      }),
    ]);

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ groupResultId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { groupResultId } = await context.params;
    const groupResult = await prisma.groupResult.findUnique({
      select: { id: true, projectId: true },
      where: { id: groupResultId },
    });

    if (!groupResult) {
      return Response.json({ error: UI_MESSAGES.groupResultNotFound }, { status: 404 });
    }

    await requireOwnedProject(groupResult.projectId, user.id);
    await prisma.$transaction([
      prisma.groupResult.delete({ where: { id: groupResultId } }),
      prisma.project.update({
        data: { updatedAt: new Date() },
        where: { id: groupResult.projectId },
      }),
    ]);

    return Response.json({ id: groupResultId });
  } catch (error) {
    return errorResponse(error);
  }
}
