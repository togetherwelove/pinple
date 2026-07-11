import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export class AuthenticationError extends Error {}

export async function requireCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError("Authentication required.");
  }

  await prisma.user.upsert({
    create: {
      email: user.email ?? user.id,
      id: user.id,
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
    },
    update: {
      email: user.email ?? user.id,
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
    },
    where: { id: user.id },
  });

  return user;
}
