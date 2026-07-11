import { requireCurrentUser } from "@/lib/auth/current-user";
import { errorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = projectSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json({ error: "프로젝트 이름을 확인해 주세요." }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: { title: parsed.data.title, userId: user.id },
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
