import { Alert, AuthShell, Card, CardHeader } from "@reinas/ui";
import { loginUrl } from "@/application/auth";
import { safeReturnPath } from "@/domain/navigation";

export const dynamic = "force-dynamic";

export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const destination = safeReturnPath((await searchParams).next);
  return (
    <AuthShell>
      <Card tone="technical" className="w-full max-w-md space-y-4">
        <CardHeader
          eyebrow="login.failed"
          title="Não foi possível entrar"
          description="O código de acesso expirou ou já tinha sido usado."
        />
        <Alert>
          <a className="underline" href={loginUrl(destination)}>
            Tentar novamente
          </a>
        </Alert>
      </Card>
    </AuthShell>
  );
}
