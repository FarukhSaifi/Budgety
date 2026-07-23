import { redirect } from "next/navigation";

import { APP_ROUTES } from "@constants/routes";

/** Legacy `/reports` → unified Analytics page (Reports tab). */
export default function ReportsRedirectPage() {
  redirect(`${APP_ROUTES.analytics}?tab=reports`);
}
