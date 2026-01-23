import { redirect } from "next/navigation";

/**
 * /dashboard/estimates redirects to /dashboard
 * The main dashboard page already displays the estimates list.
 */
export default function EstimatesPage() {
  redirect("/dashboard");
}
