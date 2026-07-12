import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/config/app";

export default function HomePage() {
  redirect(ROUTES.rosters);
}
