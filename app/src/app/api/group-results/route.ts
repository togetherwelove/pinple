import { errorResponse } from "@/lib/api/response";
import { UI_MESSAGES } from "@/lib/config/app";
import { prisma } from "@/lib/prisma";
import { requireAnonymousSession } from "@/lib/session/anonymous-session";
import { saveGroupResultSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const session = await requireAnonymousSession();
    const parsed = saveGroupResultSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json(
        { error: UI_MESSAGES.boardSnapshotInvalid },
        { status: 400 },
      );
    }

    const { name, overwrite, snapshot } = parsed.data;
    const existingResult = await prisma.groupResult.findUnique({
      select: { id: true },
      where: { workspaceId_name: { name, workspaceId: session.id } },
    });

    if (existingResult && !overwrite) {
      return Response.json(
        { duplicate: true, error: UI_MESSAGES.groupResultNameDuplicate },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (transaction) => {
      await transaction.person.deleteMany({
        where: { workspaceId: session.id },
      });

      if (snapshot.people.length > 0) {
        await transaction.person.createMany({
          data: snapshot.people.map((person) => ({
            ...person,
            workspaceId: session.id,
          })),
        });
      }

      await transaction.workspace.update({
        data: { updatedAt: new Date() },
        where: { id: session.id },
      });

      if (existingResult) {
        return transaction.groupResult.update({
          data: { members: snapshot.members },
          where: { id: existingResult.id },
        });
      }

      return transaction.groupResult.create({
        data: {
          members: snapshot.members,
          name,
          workspaceId: session.id,
        },
      });
    });

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
