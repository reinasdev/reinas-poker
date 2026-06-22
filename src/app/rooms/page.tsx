import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/application/auth";
import { listOwnedRooms } from "@/application/rooms";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MyRooms() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }
  const owned = await listOwnedRooms(user.id);
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <AppNavigation />
      <header>
        <h1 className="text-3xl font-bold">Minhas Salas</h1>
        <p className="text-zinc-500">Olá, {user.name}</p>
      </header>
      {owned.length === 0 ? (
        <Card className="py-16 text-center">
          <h2 className="font-semibold">Nenhuma sala criada</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Crie sua primeira sala para começar uma estimativa.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {owned.map((r) => (
            <Link key={r.id} href={`/${r.slug}`}>
              <Card className="transition hover:border-zinc-400">
                <div className="flex justify-between">
                  <h2 className="font-semibold">{r.name}</h2>
                  <Badge>
                    {r.status === "ACTIVE" ? "Ativa" : "Finalizada"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  /{r.slug} · {r.style}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
