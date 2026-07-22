import { APP_ROUTES } from "@constants/routes";
import { redirect } from "next/navigation";

/** Alias so `/report` lands on the canonical Reports screen. */
export default function ReportAliasPage() {
  redirect(APP_ROUTES.reports);
}
