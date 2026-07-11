import { prisma } from "@/lib/prisma";

export class ProjectAccessError extends Error {}

export async function requireOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new ProjectAccessError("Project not found.");
  }

  return project;
}
