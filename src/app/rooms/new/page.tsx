import { redirect } from "next/navigation";
import { requireUser } from "@/application/auth";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { Card } from "@/components/ui/card";
import { CreateRoomForm } from "@/components/forms/room-forms";

export default async function NewRoom() {
  try {
    await requireUser();
  } catch {
    redirect("/");
  }
  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 md:p-8">
      <AppNavigation />
      <Card>
        <h1 className="mb-6 text-2xl font-bold">Criar sala</h1>
        <CreateRoomForm />
      </Card>
    </div>
  );
}
