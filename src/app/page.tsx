import { redirect } from "next/navigation";
import { getCurrentUser } from "@/application/auth";
import { EmailForm } from "@/components/forms/auth-forms";
import { Card } from "@/components/ui/card";
import { pathWithReturn, safeReturnPath } from "@/domain/navigation";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = safeReturnPath((await searchParams).next);
  const user = await getCurrentUser();
  if (user)
    redirect(user.name ? nextPath : pathWithReturn("/onboarding", nextPath));
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Planning Poker</h1>
        <p className="mb-6 mt-2 text-sm text-zinc-500">
          Entre com seu email. Sem senha.
        </p>
        <EmailForm nextPath={nextPath} />
      </Card>
    </div>
  );
}
