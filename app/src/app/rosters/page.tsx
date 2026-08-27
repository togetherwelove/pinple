import { Workspace } from "@/components/dashboard/workspace";
import { AUTH_QUERY } from "@/lib/config/app";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceSession } from "@/lib/session/workspace-session";
import type { StoredGroupResult } from "@/lib/types/domain";

type RosterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RosterPage({ searchParams }: RosterPageProps) {
  const session = await requireWorkspaceSession();
  const authenticationState = (await searchParams)[AUTH_QUERY.errorParameter];
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
      <Workspace
        account={session.account}
        hasAuthenticationError={authenticationState === AUTH_QUERY.errorValue}
        savedGroupResults={savedGroupResults}
      />
    </div>
  );
}
