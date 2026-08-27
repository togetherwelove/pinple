import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ANONYMOUS_SESSION_COOKIE,
  isAnonymousSessionId,
} from "@/lib/session/config";
import { prepareAuthenticatedWorkspace } from "@/lib/session/transfer-workspace";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceAccount = {
  email: string | null;
  name: string | null;
};

export class WorkspaceSessionError extends Error {}

function userDisplayName(metadata: Record<string, unknown>) {
  const fullName = metadata.full_name;

  return typeof fullName === "string" && fullName.trim()
    ? fullName.trim()
    : null;
}

export async function requireWorkspaceSession() {
  const anonymousSessionId = (await cookies()).get(
    ANONYMOUS_SESSION_COOKIE,
  )?.value;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await prepareAuthenticatedWorkspace(
      user.id,
      isAnonymousSessionId(anonymousSessionId) ? anonymousSessionId : null,
    );

    return {
      account: {
        email: user.email ?? null,
        name: userDisplayName(user.user_metadata),
      } satisfies WorkspaceAccount,
      id: user.id,
    };
  }

  if (!isAnonymousSessionId(anonymousSessionId)) {
    throw new WorkspaceSessionError("Workspace session required.");
  }

  await prisma.workspace.upsert({
    create: { id: anonymousSessionId },
    update: {},
    where: { id: anonymousSessionId },
  });

  return { account: null, id: anonymousSessionId };
}
