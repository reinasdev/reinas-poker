import { redirect } from "next/navigation";
import { requireUser } from "@/application/auth";
import { AuthShell } from "@/components/layout/auth-shell";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/forms/auth-forms";
import { safeReturnPath } from "@/domain/navigation";

export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = safeReturnPath((await searchParams).next);
  const user = await requireUser({ complete: false });
  if (user.name) redirect(nextPath);

  return (
    <AuthShell>
      <Card className="w-full max-w-md border-[var(--technical-border)]">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">
            profile.setup
          </p>
          <h1 className="text-2xl font-bold">Primeiro acesso</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Defina o nome exibido nas salas e votações.
          </p>
        </div>
        <ProfileForm nextPath={nextPath} />
      </Card>
    </AuthShell>
  );
}
