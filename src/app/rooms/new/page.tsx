import { redirect } from "next/navigation";
import { requireUser } from "@/application/auth";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { Card } from "@/components/ui/card";
import { CreateRoomForm } from "@/components/forms/room-forms";

export default async function NewRoom() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <AppNavigation userName={user.name} />
      <Card className="border-[var(--technical-border)]">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">
            rooms.create
          </p>
          <h1 className="text-2xl font-bold">Criar sala</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Configure o link, senha e deck usados na sessão.
          </p>
        </div>
        <CreateRoomForm />
      </Card>
    </div>
  );
}
