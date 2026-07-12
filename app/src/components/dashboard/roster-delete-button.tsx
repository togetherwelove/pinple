"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES, UI_LABELS, UI_MESSAGES } from "@/lib/config/app";

type RosterDeleteButtonProps = {
  className?: string;
  isActive: boolean;
  projectId: string;
};

export function RosterDeleteButton({
  className,
  isActive,
  projectId,
}: RosterDeleteButtonProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function deleteRoster() {
    setErrorMessage(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });

      if (!response.ok) {
        setErrorMessage((await response.json() as { error?: string }).error ?? UI_MESSAGES.rosterDeleteFailed);
        setIsDeleting(false);
        return;
      }

      if (isActive) {
        router.push(ROUTES.dashboard);
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage(UI_MESSAGES.rosterDeleteFailed);
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        aria-label={UI_LABELS.deleteRoster}
        className={className ?? "flex size-8 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-red-50 hover:text-red-700"}
        onClick={() => setIsOpen(true)}
        title={UI_LABELS.deleteRoster}
        type="button"
      >
        <Trash2 size={15} />
      </button>
      {isOpen ? (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog">
          <section className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
            <h2 className="font-semibold">{UI_LABELS.deleteRoster}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{UI_MESSAGES.rosterDeleteWarning}</p>
            {errorMessage ? <p className="mt-3 text-sm text-red-700" role="alert">{errorMessage}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]" disabled={isDeleting} onClick={() => setIsOpen(false)} type="button">{UI_LABELS.cancel}</button>
              <button className="bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={isDeleting} onClick={() => void deleteRoster()} type="button">{isDeleting ? UI_LABELS.deleting : UI_LABELS.delete}</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
