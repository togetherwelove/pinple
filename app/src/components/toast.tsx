"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";
import {
  TOAST_DURATION_MS,
  TOAST_TONES,
  UI_LABELS,
} from "@/lib/config/app";

type ToastTone = (typeof TOAST_TONES)[keyof typeof TOAST_TONES];

type ToastProps = {
  message: string;
  onDismiss: () => void;
  tone: ToastTone;
};

export function Toast({ message, onDismiss, tone }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, TOAST_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  const isError = tone === TOAST_TONES.error;

  return (
    <div
      className={`fixed right-4 bottom-4 left-4 z-50 flex items-center gap-3 border px-4 py-3 text-sm shadow-lg md:left-auto md:max-w-sm ${
        isError
          ? "border-[var(--danger)] bg-[var(--danger)] text-[var(--danger-foreground)]"
          : "border-[var(--border)] bg-[var(--ink)] text-[var(--surface)]"
      }`}
      role={isError ? "alert" : "status"}
    >
      {isError ? (
        <AlertCircle className="shrink-0" size={17} />
      ) : (
        <CheckCircle2 className="shrink-0" size={17} />
      )}
      <span className="min-w-0 flex-1">{message}</span>
      <button
        aria-label={UI_LABELS.dismissToast}
        className="flex size-7 shrink-0 items-center justify-center hover:opacity-70"
        onClick={onDismiss}
        type="button"
      >
        <X size={15} />
      </button>
    </div>
  );
}
