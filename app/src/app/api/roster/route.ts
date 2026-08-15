import { errorResponse } from "@/lib/api/response";
import { UI_MESSAGES } from "@/lib/config/app";
import { prisma } from "@/lib/prisma";
import { requireAnonymousSession } from "@/lib/session/anonymous-session";
import { boardSnapshotSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const session = await requireAnonymousSession();
    const parsed = boardSnapshotSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json(
        { error: UI_MESSAGES.boardSnapshotInvalid },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (transaction) => {
      await transaction.person.deleteMany({
        where: { workspaceId: session.id },
      });
      await transaction.person.createMany({
        data: parsed.data.people.map((person) => ({
          ...person,
          workspaceId: session.id,
        })),
      });
      await transaction.workspace.update({
        data: { updatedAt: new Date() },
        where: { id: session.id },
      });

      return transaction.groupResult.upsert({
        create: {
          members: parsed.data.members,
          workspaceId: session.id,
        },
        update: { members: parsed.data.members },
        where: { workspaceId: session.id },
      });
    });

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
