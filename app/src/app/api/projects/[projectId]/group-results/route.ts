import { GROUP_RESULT_NAME_PREFIX } from "@/lib/config/app";
import { errorResponse } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/auth/project-access";
import { distributePeople } from "@/lib/grouping/distribute-people";
import { appointLeaders } from "@/lib/grouping/leader-assignment";
import { prisma } from "@/lib/prisma";
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
      return Response.json({ error: "조 정원을 확인해 주세요." }, { status: 400 });
    }

    const people = await prisma.person.findMany({
      orderBy: { createdAt: "asc" },
      where: { projectId },
    });
    const capacity = parsed.data.groupSizes.reduce((sum, size) => sum + size, 0);

    if (capacity !== people.length) {
      return Response.json({ error: "조 정원의 합계가 전체 인원과 같아야 합니다." }, { status: 400 });
    }

    const groups = appointLeaders(
      distributePeople(
        people.map((person) => ({
          ...person,
          gender: person.gender as "M" | "F",
        })),
        parsed.data.groupSizes,
        parsed.data.strategy,
      ),
      parsed.data.leaderSelectionMode,
    );
    const result = await prisma.groupResult.create({
      data: {
        members: { groups, strategy: parsed.data.strategy },
        name: createResultName(),
        projectId,
      },
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
