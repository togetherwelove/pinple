"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RosterDeleteButton } from "@/components/dashboard/roster-delete-button";
import {
  APP_NAME,
  NEW_ROSTER_ROUTE,
  PROJECT_NAVIGATION,
  rosterProjectRoute,
} from "@/lib/config/app";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleLabel = isCollapsed
    ? PROJECT_NAVIGATION.openSidebar
    : PROJECT_NAVIGATION.closeSidebar;

  return (
    <aside
      className={`hidden h-full shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] p-3 transition-[width] duration-200 md:flex ${isCollapsed ? "w-16" : "w-64"}`}
    >
      <header className={`flex h-10 shrink-0 items-center ${isCollapsed ? "justify-center" : "justify-between px-3"}`}>
        {!isCollapsed && <p className="text-base font-semibold">{APP_NAME}</p>}
        <button
          aria-expanded={!isCollapsed}
          aria-label={toggleLabel}
          className="flex size-8 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--foreground)]"
          onClick={() => setIsCollapsed((current) => !current)}
          title={toggleLabel}
          type="button"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </header>
      {!isCollapsed && (
        <>
          <Link
            className="mb-4 mt-2 block border border-dashed border-[var(--border)] px-3 py-2 text-sm"
            href={NEW_ROSTER_ROUTE}
          >
            {PROJECT_NAVIGATION.newProject}
          </Link>
          <p className="mb-1 px-3 text-xs font-medium text-[var(--muted)]">
            {PROJECT_NAVIGATION.recent}
          </p>
          <nav
            aria-label={PROJECT_NAVIGATION.label}
            className="flex-1 space-y-1 overflow-y-auto"
          >
            {projects.map((project) => (
              <div className="flex items-center" key={project.id}>
                <Link
                  className={`min-w-0 flex-1 truncate px-3 py-2 text-sm ${project.id === activeProjectId ? "bg-[var(--canvas)] font-medium" : "text-[var(--muted)]"}`}
                  href={rosterProjectRoute(project.id)}
                >
                  {project.title}
                </Link>
                <RosterDeleteButton
                  isActive={project.id === activeProjectId}
                  projectId={project.id}
                />
              </div>
            ))}
          </nav>
        </>
      )}
      {isCollapsed && <div className="flex-1" />}
      <section className="mt-auto border-t border-[var(--border)] pt-3">
        <div className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : ""}`}>
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--canvas)] text-xs font-semibold"
          >
            {getInitial(displayName)}
          </span>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-[var(--muted)]">{account.email}</p>
            </div>
          )}
          <SignOutButton iconOnly />
        </div>
      </section>
    </aside>
  );
}
