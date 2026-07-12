import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Workspace } from "@/components/dashboard/workspace";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import type { GroupResultMembers } from "@/lib/types/domain";

type DashboardPageProps = { searchParams: Promise<{ project?: string }> };

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  const params = await searchParams;
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: "desc" }, where: { userId: user.id } });
  const projectId = params.project ?? projects[0]?.id;
  const project = projectId ? await prisma.project.findFirst({ include: { groupResults: { orderBy: { createdAt: "desc" }, take: 1 }, people: { orderBy: { createdAt: "asc" } } }, where: { id: projectId, userId: user.id } }) : null;
  const result = project?.groupResults[0];
  const accountName =
    user.user_metadata.full_name ?? user.user_metadata.name ?? null;

  return (
    <div className="flex min-h-screen bg-[var(--canvas)]">
      <Sidebar
        account={{ email: user.email ?? user.id, name: accountName }}
        activeProjectId={project?.id}
        projects={projects}
      />
      <div className="min-w-0 flex-1">
        <nav aria-label="프로젝트 목록" className="flex gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] p-3 md:hidden">
          <Link className="shrink-0 border border-dashed border-[var(--border)] px-3 py-2 text-sm" href="/dashboard">
            + 새 프로젝트
          </Link>
          {projects.map((item) => (
            <Link
              className={`shrink-0 px-3 py-2 text-sm ${item.id === project?.id ? "bg-[var(--canvas)] font-medium" : "text-[var(--muted)]"}`}
              href={`/dashboard?project=${item.id}`}
              key={item.id}
            >
              {item.title}
            </Link>
          ))}
          <SignOutButton className="shrink-0" />
        </nav>
        <Workspace
          initialGroups={(result?.members as unknown as GroupResultMembers) ?? null}
          initialResultId={result?.id ?? null}
          key={`${project?.id ?? "new-project"}:${project?.people.length ?? 0}`}
          project={project ? { id: project.id, people: project.people.map((person) => ({ ...person, gender: person.gender as "M" | "F" })), title: project.title } : null}
        />
      </div>
    </div>
  );
}
