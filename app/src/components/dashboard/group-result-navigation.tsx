import Link from "next/link";
import { ListPlus } from "lucide-react";
import {
  ROSTER_BOARD,
  projectGroupResultRoute,
  rosterProjectRoute,
} from "@/lib/config/app";
import type { GroupResultSummary } from "@/lib/types/domain";

type GroupResultNavigationProps = {
  groupResults: GroupResultSummary[];
  projectId: string;
  projectTitle: string;
  selectedGroupResultId?: string;
};

function navigationClass(isActive: boolean) {
  return `shrink-0 border px-3 py-2 text-sm ${
    isActive
      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)]"
  }`;
}

export function GroupResultNavigation({
  groupResults,
  projectId,
  projectTitle,
  selectedGroupResultId,
}: GroupResultNavigationProps) {
  return (
    <section className="mb-5 border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--muted)]">{ROSTER_BOARD.project}</p>
          <h1 className="mt-1 text-lg font-semibold">{projectTitle}</h1>
        </div>
        <Link
          className="flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]"
          href={rosterProjectRoute(projectId)}
        >
          <ListPlus size={16} />
          {ROSTER_BOARD.newGroupResult}
        </Link>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium">{ROSTER_BOARD.groupResults}</p>
        <nav
          aria-label={ROSTER_BOARD.groupResults}
          className="mt-2 flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            className={navigationClass(!selectedGroupResultId)}
            href={rosterProjectRoute(projectId)}
          >
            {ROSTER_BOARD.baseRoster}
          </Link>
          {groupResults.map((result) => (
            <Link
              className={navigationClass(result.id === selectedGroupResultId)}
              href={projectGroupResultRoute(projectId, result.id)}
              key={result.id}
            >
              {result.name}
            </Link>
          ))}
        </nav>
        {groupResults.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--muted)]">{ROSTER_BOARD.noGroupResults}</p>
        ) : null}
      </div>
    </section>
  );
}
