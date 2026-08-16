import { CopyrightFooter } from "@/components/copyright-footer";

export default function RosterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--canvas)]">
      <div className="min-h-0 flex-1">{children}</div>
      <CopyrightFooter />
    </div>
  );
}
