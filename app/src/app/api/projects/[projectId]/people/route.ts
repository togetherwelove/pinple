import { GENDER, INPUT_GENDER } from "@/lib/config/app";
import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { prisma } from "@/lib/prisma";
import { peopleRequestSchema } from "@/lib/validation/schemas";
import type { StoredGender } from "@/lib/types/domain";

type IncomingPerson = { age: number | null; gender: string; name: string };
const UNKNOWN_AGE_IDENTITY = "unknown-age";

function normalizeGender(gender: string): StoredGender {
  if (
    gender === GENDER.male ||
    gender === INPUT_GENDER.male[0] ||
    gender === INPUT_GENDER.male[1]
  ) {
    return GENDER.male;
  }

  if (
    gender === GENDER.female ||
    gender === INPUT_GENDER.female[0] ||
    gender === INPUT_GENDER.female[1]
  ) {
    return GENDER.female;
  }

  return GENDER.unknown;
}

function normalizePeople(projectId: string, people: IncomingPerson[]) {
  const uniquePeople = new Map<
    string,
    { age: number | null; gender: StoredGender; name: string; projectId: string }
  >();

  people.forEach((person) => {
    const gender = normalizeGender(person.gender);
    const ageIdentity = person.age ?? UNKNOWN_AGE_IDENTITY;
    const identity = `${person.name}\u0000${gender}\u0000${ageIdentity}`;

    uniquePeople.set(identity, { age: person.age, gender, name: person.name, projectId });
  });

  return [...uniquePeople.values()];
}

function personIdentity(person: IncomingPerson) {
  return `${person.name}\u0000${person.gender}\u0000${person.age ?? UNKNOWN_AGE_IDENTITY}`;
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

    const people = normalizePeople(projectId, parsed.data.people);
    const existingPeople = await prisma.person.findMany({
      select: { age: true, gender: true, name: true },
      where: { projectId },
    });
    const existingIdentities = new Set(existingPeople.map(personIdentity));
    const peopleToCreate = people.filter((person) => !existingIdentities.has(personIdentity(person)));
    const result = await prisma.person.createMany({ data: peopleToCreate, skipDuplicates: true });

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
