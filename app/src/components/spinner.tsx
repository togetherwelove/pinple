import { LoaderCircle } from "lucide-react";

type SpinnerProps = {
  className?: string;
  size?: "sm" | "md";
};

const SPINNER_SIZE_CLASSES = {
  md: "size-5",
  sm: "size-4",
} as const;

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={`shrink-0 animate-spin ${SPINNER_SIZE_CLASSES[size]} ${className ?? ""}`}
    />
  );
}
