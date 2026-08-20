import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/application/auth";

export const dynamic = "force-dynamic";

/** A porta de entrada só decide o destino: sala ou login no reinas-id. */
export default async function Index() {
  const user = await getCurrentUser();
  if (user?.name) redirect("/rooms");
  redirect(loginUrl("/rooms"));
}
