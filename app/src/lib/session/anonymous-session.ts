import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ANONYMOUS_SESSION_COOKIE,
  isAnonymousSessionId,
} from "@/lib/session/config";

export class AnonymousSessionError extends Error {}

export async function requireAnonymousSession() {
  const sessionId = (await cookies()).get(ANONYMOUS_SESSION_COOKIE)?.value;

  if (!isAnonymousSessionId(sessionId)) {
    throw new AnonymousSessionError("Anonymous session required.");
  }

  await prisma.workspace.upsert({
    create: { id: sessionId },
    update: {},
    where: { id: sessionId },
  });

  return { id: sessionId };
}
