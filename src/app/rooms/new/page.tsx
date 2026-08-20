import { redirect } from "next/navigation";
import { Card, CardHeader } from "@reinas/ui";
import { getCurrentUser, loginUrl } from "@/application/auth";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { CreateRoomForm } from "@/components/forms/room-forms";

export const dynamic = "force-dynamic";

export default async function NewRoom() {
  const user = await getCurrentUser();
  if (!user?.name) redirect(loginUrl("/rooms/new"));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <AppNavigation userName={user.name} />
      <Card tone="technical">
        <CardHeader
          eyebrow="rooms.create"
          title={<span className="text-2xl font-bold">Criar sala</span>}
          description="Configure o link, senha e deck usados na sessão."
        />
        <CreateRoomForm />
      </Card>
    </div>
  );
}
