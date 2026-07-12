import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { prisma } from "@/lib/prisma";
import { groupResultMembersSchema } from "@/lib/validation/schemas";

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
      return Response.json({ error: "조 편성 결과를 찾을 수 없습니다." }, { status: 404 });
    }

    await requireOwnedProject(groupResult.projectId, user.id);
    const parsed = groupResultMembersSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json({ error: "조 데이터를 확인해 주세요." }, { status: 400 });
    }

    const result = await prisma.groupResult.update({
      data: { members: parsed.data },
      where: { id: groupResultId },
    });

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
