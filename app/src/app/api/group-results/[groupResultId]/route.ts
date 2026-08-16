import { errorResponse } from "@/lib/api/response";
import { UI_MESSAGES } from "@/lib/config/app";
import { prisma } from "@/lib/prisma";
import { requireAnonymousSession } from "@/lib/session/anonymous-session";
import { groupResultIdSchema } from "@/lib/validation/schemas";

type GroupResultRouteContext = {
  params: Promise<{ groupResultId: string }>;
};

export async function DELETE(
  _request: Request,
  context: GroupResultRouteContext,
) {
  try {
    const session = await requireAnonymousSession();
    const parsedId = groupResultIdSchema.safeParse(
      (await context.params).groupResultId,
    );

    if (!parsedId.success) {
      return Response.json(
        { error: UI_MESSAGES.groupResultNotFound },
        { status: 404 },
      );
    }

    const deletion = await prisma.groupResult.deleteMany({
      where: {
        id: parsedId.data,
        workspaceId: session.id,
      },
    });

    if (deletion.count === 0) {
      return Response.json(
        { error: UI_MESSAGES.groupResultNotFound },
        { status: 404 },
      );
    }

    return Response.json({ id: parsedId.data });
  } catch (error) {
    return errorResponse(error);
  }
}
