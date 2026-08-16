import { Workspace } from "@/components/dashboard/workspace";
import { prisma } from "@/lib/prisma";
import { requireAnonymousSession } from "@/lib/session/anonymous-session";
import type { StoredGroupResult } from "@/lib/types/domain";

export default async function RosterPage() {
  const session = await requireAnonymousSession();
  const workspace = await prisma.workspace.findUniqueOrThrow({
    select: {
      groupResults: {
        orderBy: { updatedAt: "desc" },
        select: {
          createdAt: true,
          id: true,
          members: true,
          name: true,
          updatedAt: true,
        },
      },
    },
    where: { id: session.id },
  });
  const savedGroupResults: StoredGroupResult[] = workspace.groupResults.map(
    (result) => ({
      createdAt: result.createdAt.toISOString(),
      id: result.id,
      members: result.members as unknown as StoredGroupResult["members"],
      name: result.name,
      updatedAt: result.updatedAt.toISOString(),
    }),
  );

  return (
    <div className="h-full overflow-hidden bg-[var(--canvas)]">
      <Workspace savedGroupResults={savedGroupResults} />
    </div>
  );
}
