import { redirect } from "next/navigation";
import { getCurrentUser } from "@/application/auth";
import { EmailForm } from "@/components/forms/auth-forms";
import { AuthShell } from "@/components/layout/auth-shell";
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
    <AuthShell>
      <Card className="w-full max-w-md border-[var(--technical-border)]">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">
            login.request
          </p>
          <h1 className="text-3xl font-bold">Planning Poker</h1>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            Entre com seu email para receber um código de acesso.
          </p>
        </div>
        <p className="mb-4 rounded-md border border-[var(--border)] bg-[var(--technical)] px-3 py-2 text-xs text-[var(--muted)]">
          auth.mode=passwordless
        </p>
        <EmailForm nextPath={nextPath} />
      </Card>
    </AuthShell>
  );
}
