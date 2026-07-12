import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RosterDeleteButton } from "@/components/dashboard/roster-delete-button";

type SidebarAccount = {
  email: string;
  name: string | null;
};

type SidebarProject = {
  id: string;
  title: string;
};

type SidebarProps = {
  account: SidebarAccount;
  activeProjectId: string | undefined;
  projects: SidebarProject[];
};

function getInitial(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase();
}

export function Sidebar({ account, activeProjectId, projects }: SidebarProps) {
  const displayName = account.name?.trim() || account.email;

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] p-3 md:flex">
      <div>
        <p className="px-3 py-2 text-sm font-semibold">명단</p>
        <Link
          className="mb-3 block border border-dashed border-[var(--border)] px-3 py-2 text-sm"
          href="/dashboard"
        >
          + 새로운 명단
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {projects.map((project) => (
          <div className="flex items-center" key={project.id}>
            <Link
              className={`min-w-0 flex-1 truncate px-3 py-2 text-sm ${project.id === activeProjectId ? "bg-[var(--canvas)] font-medium" : "text-[var(--muted)]"}`}
              href={`/dashboard?project=${project.id}`}
            >
              {project.title}
            </Link>
            <RosterDeleteButton isActive={project.id === activeProjectId} projectId={project.id} />
          </div>
        ))}
      </nav>
      <section className="mt-auto border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--canvas)] text-xs font-semibold"
          >
            {getInitial(displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-[var(--muted)]">{account.email}</p>
          </div>
          <SignOutButton iconOnly />
        </div>
      </section>
    </aside>
  );
}
