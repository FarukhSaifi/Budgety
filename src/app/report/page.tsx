import { redirect } from "next/navigation";

import { APP_ROUTES } from "@constants/routes";

/** Alias so `/report` lands on the unified Analytics page (Reports tab). */
export default function ReportAliasPage() {
  redirect(`${APP_ROUTES.analytics}?tab=reports`);
}
