import { redirect } from "next/navigation";

import { APP_ROUTES } from "@constants/routes";

/** Alias for Home / overview. */
export default function DashboardPage() {
  redirect(APP_ROUTES.home);
}
