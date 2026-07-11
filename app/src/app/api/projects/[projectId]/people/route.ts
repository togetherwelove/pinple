import { GENDER, INPUT_GENDER } from "@/lib/config/app";
import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { prisma } from "@/lib/prisma";
import { peopleRequestSchema } from "@/lib/validation/schemas";

function normalizePeople(projectId: string, people: { age: number; gender: string; name: string }[]) {
  const uniquePeople = new Map<string, { age: number; gender: string; name: string; projectId: string }>();

  people.forEach((person) => {
    const gender =
      person.gender === INPUT_GENDER.male[0] || person.gender === INPUT_GENDER.male[1]
        ? GENDER.male
        : GENDER.female;
    const identity = `${person.name}\u0000${gender}\u0000${person.age}`;

    uniquePeople.set(identity, { age: person.age, gender, name: person.name, projectId });
  });

  return [...uniquePeople.values()];
}

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
      data: normalizePeople(projectId, parsed.data.people),
      skipDuplicates: true,
    });

    return Response.json({ createdCount: result.count });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
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

    const people = normalizePeople(projectId, parsed.data.people);

    await prisma.$transaction(async (transaction) => {
      await transaction.person.deleteMany({ where: { projectId } });
      await transaction.person.createMany({ data: people });
      await transaction.project.update({ data: { updatedAt: new Date() }, where: { id: projectId } });
    });

    const savedPeople = await prisma.person.findMany({
      orderBy: { createdAt: "asc" },
      where: { projectId },
    });

    return Response.json({ people: savedPeople });
  } catch (error) {
    return errorResponse(error);
  }
}
