import { GROUP_RESULT_NAME_PREFIX, UI_MESSAGES } from "@/lib/config/app";
import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { distributePeople } from "@/lib/grouping/distribute-people";
import { appointLeaders } from "@/lib/grouping/leader-assignment";
import { shuffle } from "@/lib/grouping/shuffle";
import { prisma } from "@/lib/prisma";
import type { StoredGender } from "@/lib/types/domain";
import { groupingRequestSchema } from "@/lib/validation/schemas";

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
    const parsed = groupingRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json({ error: UI_MESSAGES.groupResultInvalid }, { status: 400 });
    }

    const people = await prisma.person.findMany({
      orderBy: { createdAt: "asc" },
      where: { projectId },
    });
    const capacity = parsed.data.groupSizes.reduce((sum, size) => sum + size, 0);

    if (capacity > people.length) {
      return Response.json({ error: UI_MESSAGES.groupCapacityExceedsPeople }, { status: 400 });
    }

    const shuffledPeople = shuffle(
      people.map((person) => ({
        ...person,
        gender: person.gender as StoredGender,
      })),
    );
    const assignedPeople = shuffledPeople.slice(0, capacity);
    const unassigned = shuffledPeople.slice(capacity).map((person) => ({
      ...person,
      isLeader: false,
    }));
    const groups = appointLeaders(
      distributePeople(
        assignedPeople,
        parsed.data.groupSizes,
        parsed.data.strategy,
      ),
      parsed.data.leaderSelectionMode,
    );
    const [result] = await prisma.$transaction([
      prisma.groupResult.create({
        data: {
          members: {
            groups,
            leaderSelectionMode: parsed.data.leaderSelectionMode,
            strategy: parsed.data.strategy,
            unassigned,
          },
          name: parsed.data.name ?? createResultName(),
          projectId,
        },
      }),
      prisma.project.update({
        data: { updatedAt: new Date() },
        where: { id: projectId },
      }),
    ]);

    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
