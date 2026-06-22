import { Card } from "@/components/ui/card";
import { CodeForm } from "@/components/forms/auth-forms";
import { safeReturnPath } from "@/domain/navigation";

export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Confira seu email</h1>
        <p className="mb-6 mt-2 text-sm text-zinc-500">
          Enviamos um código de 6 dígitos para {query.email ?? ""}.
        </p>
        <CodeForm
          email={query.email ?? ""}
          nextPath={safeReturnPath(query.next)}
        />
      </Card>
    </div>
  );
}
