import { Card } from "@/components/ui/card";
import { CodeForm } from "@/components/forms/auth-forms";
import { AuthShell } from "@/components/layout/auth-shell";
import { safeReturnPath } from "@/domain/navigation";

export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthShell>
      <Card className="w-full max-w-md border-[var(--technical-border)]">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">
            login.verify
          </p>
          <h1 className="text-2xl font-bold">Confira seu email</h1>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            Enviamos um código de 6 dígitos para{" "}
            <span className="text-[var(--primary)]">{query.email ?? ""}</span>.
          </p>
        </div>
        <CodeForm
          email={query.email ?? ""}
          nextPath={safeReturnPath(query.next)}
        />
      </Card>
    </AuthShell>
  );
}
