import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/config/app";

export default function LegacyDashboardPage() {
  redirect(ROUTES.rosters);
}
