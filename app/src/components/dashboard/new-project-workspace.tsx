"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import {
  INPUT_DEPENDENT_BUTTON_CLASSES,
  ROSTER_CREATION,
  UI_LABELS,
  UI_MESSAGES,
  rosterProjectRoute,
} from "@/lib/config/app";

async function createProject(title: string) {
  const response = await fetch("/api/projects", {
    body: JSON.stringify({ title }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const project = (await response.json()) as { error?: string; id?: string };

  if (!response.ok || !project.id) {
    throw new Error(project.error ?? UI_MESSAGES.saveFailed);
  }

  return project.id;
}

export function NewProjectWorkspace() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const canCreate = title.trim().length > 0 && !isCreating;

  async function handleCreate() {
    setIsCreating(true);

    try {
      const projectId = await createProject(title);
      router.push(rosterProjectRoute(projectId));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : UI_MESSAGES.saveFailed);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-[var(--canvas)] p-6">
      <section className="w-full max-w-md text-center">
        <p className="text-sm text-[var(--muted)]">{ROSTER_CREATION.subtitle}</p>
        <h1 className="mt-3 text-2xl font-semibold">{ROSTER_CREATION.heading}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{ROSTER_CREATION.description}</p>
        {notice ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {notice}
          </p>
        ) : null}
        <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-5 text-left">
          <input
            className="w-full border border-[var(--border)] p-3"
            onChange={(event) => setTitle(event.target.value)}
            placeholder={ROSTER_CREATION.inputPlaceholder}
            value={title}
          />
          <button
            className={`mt-3 flex items-center gap-2 px-4 py-3 ${canCreate ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`}
            disabled={!canCreate}
            onClick={() => void handleCreate()}
            type="button"
          >
            {isCreating ? <Spinner size="sm" /> : <Plus size={16} />}
            {isCreating ? UI_LABELS.creatingRoster : ROSTER_CREATION.start}
          </button>
          {!title.trim() ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              {UI_MESSAGES.projectTitleRequired}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
