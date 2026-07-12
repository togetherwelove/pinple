import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;

    await requireOwnedProject(projectId, user.id);
    await prisma.project.delete({ where: { id: projectId } });

    return Response.json({ id: projectId });
  } catch (error) {
    return errorResponse(error);
  }
}
