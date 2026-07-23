import { redirect } from "next/navigation";

import { APP_ROUTES } from "@constants/routes";

/** Convenience alias — `/bill` → `/bills`. */
export default function BillRedirectPage() {
  redirect(APP_ROUTES.bills);
}
