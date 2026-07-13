import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RosterDeleteButton } from "@/components/dashboard/roster-delete-button";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Workspace } from "@/components/dashboard/workspace";
import { requireCurrentUser } from "@/lib/auth/current-user";
import {
  NEW_ROSTER_ROUTE,
  ROSTER_VIEW_MODES,
  ROUTES,
  rosterProjectRoute,
} from "@/lib/config/app";
import { prisma } from "@/lib/prisma";
import type { GroupResultMembers, StoredGender } from "@/lib/types/domain";

type RosterPageProps = { searchParams: Promise<{ project?: string; view?: string }> };

export default async function RosterPage({ searchParams }: RosterPageProps) {
  const user = await requireCurrentUser().catch(() => null);

  if (!user) {
    redirect(ROUTES.login);
  }

  const params = await searchParams;
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    where: { userId: user.id },
  });
  const isCreateView = params.view === ROSTER_VIEW_MODES.create;
  const projectId = isCreateView ? undefined : params.project ?? projects[0]?.id;
  const project = projectId
    ? await prisma.project.findFirst({
        include: {
          groupResults: { orderBy: { createdAt: "desc" }, take: 1 },
          people: { orderBy: { createdAt: "asc" } },
        },
        where: { id: projectId, userId: user.id },
      })
    : null;
  const result = project?.groupResults[0];
  const accountName = user.user_metadata.full_name ?? user.user_metadata.name ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      <Sidebar
        account={{ email: user.email ?? user.id, name: accountName }}
        activeProjectId={project?.id}
        projects={projects}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <nav
          aria-label="명단 목록"
          className="flex shrink-0 gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] p-3 md:hidden"
        >
          <Link
            className="shrink-0 border border-dashed border-[var(--border)] px-3 py-2 text-sm"
            href={NEW_ROSTER_ROUTE}
          >
            + 새로운 명단
          </Link>
          {projects.map((item) => (
            <div className="flex shrink-0 items-center" key={item.id}>
              <Link
                className={`px-3 py-2 text-sm ${item.id === project?.id ? "bg-[var(--canvas)] font-medium" : "text-[var(--muted)]"}`}
                href={rosterProjectRoute(item.id)}
              >
                {item.title}
              </Link>
              <RosterDeleteButton
                className="flex size-8 items-center justify-center text-[var(--muted)] hover:bg-red-50 hover:text-red-700"
                isActive={item.id === project?.id}
                projectId={item.id}
              />
            </div>
          ))}
          <SignOutButton className="shrink-0" />
        </nav>
        <div className="min-h-0 flex-1">
          <Workspace
            initialGroups={(result?.members as unknown as GroupResultMembers) ?? null}
            key={`${project?.id ?? "new-project"}:${project?.people.length ?? 0}`}
            project={
              project
                ? {
                    id: project.id,
                    people: project.people.map((person) => ({
                      ...person,
                      gender: person.gender as StoredGender,
                    })),
                    title: project.title,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
