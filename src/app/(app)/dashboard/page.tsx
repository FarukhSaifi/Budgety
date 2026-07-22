import { APP_ROUTES } from "@constants/routes";
import { redirect } from "next/navigation";

/** Alias for Home / overview. */
export default function DashboardPage() {
  redirect(APP_ROUTES.home);
}
