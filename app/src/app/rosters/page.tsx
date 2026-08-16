import { Workspace } from "@/components/dashboard/workspace";
import { prisma } from "@/lib/prisma";
import { requireAnonymousSession } from "@/lib/session/anonymous-session";
import type { StoredGroupResult } from "@/lib/types/domain";

export default async function RosterPage() {
  const session = await requireAnonymousSession();
  const workspace = await prisma.workspace.findUniqueOrThrow({
    include: {
      groupResult: { select: { id: true, members: true } },
      people: { orderBy: { createdAt: "asc" } },
    },
    where: { id: session.id },
  });
  const groupResult: StoredGroupResult | null = workspace.groupResult
    ? {
        id: workspace.groupResult.id,
        members:
          workspace.groupResult.members as unknown as StoredGroupResult["members"],
      }
    : null;

  return (
    <div className="h-full overflow-hidden bg-[var(--canvas)]">
      <Workspace
        groupResult={groupResult}
        people={workspace.people}
      />
    </div>
  );
}
