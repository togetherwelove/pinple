import { GENDER, INPUT_GENDER } from "@/lib/config/app";
import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { prisma } from "@/lib/prisma";
import { peopleRequestSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    await requireOwnedProject(projectId, user.id);
    const parsed = peopleRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json({ error: "인원 입력 형식을 확인해 주세요." }, { status: 400 });
    }

    const result = await prisma.person.createMany({
      data: parsed.data.people.map((person) => ({
        age: person.age,
        gender:
          person.gender === INPUT_GENDER.male[0] ||
          person.gender === INPUT_GENDER.male[1]
            ? GENDER.male
            : GENDER.female,
        name: person.name,
        projectId,
      })),
      skipDuplicates: true,
    });

    return Response.json({ createdCount: result.count });
  } catch (error) {
    return errorResponse(error);
  }
}
