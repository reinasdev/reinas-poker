import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/application/auth";
import { listAccessibleRooms } from "@/application/rooms";
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
  const accessibleRooms = await listAccessibleRooms(user.id);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <AppNavigation userName={user.name} />
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase text-[var(--primary)]">
          rooms.index
        </p>
        <h1 className="text-3xl font-bold">Minhas salas</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Olá, {user.name}
        </p>
      </header>
      {accessibleRooms.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase text-[var(--primary)]">
            empty.state
          </p>
          <h2 className="font-semibold">Nenhuma sala criada</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Crie ou entre em uma sala para começar uma estimativa.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accessibleRooms.map((r) => (
            <Link key={r.id} href={`/${r.slug}`}>
              <Card className="h-full transition hover:border-[var(--primary)] hover:bg-[var(--surface)]">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-semibold">{r.name}</h2>
                  <div className="flex flex-wrap justify-end gap-2">
                    {r.adminId === user.id && (
                      <Badge variant="technical">Admin</Badge>
                    )}
                    <Badge
                      variant={r.status === "ACTIVE" ? "active" : "finished"}
                    >
                      {r.status === "ACTIVE" ? "Ativa" : "Finalizada"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="technical">/{r.slug}</Badge>
                  <Badge>{r.style}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
