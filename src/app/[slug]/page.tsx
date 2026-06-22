import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/application/auth";
import {
  getMembership,
  getRoomBySlug,
  roomProjection,
  roomSummary,
} from "@/application/rooms";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { Card } from "@/components/ui/card";
import { JoinRoomForm } from "@/components/forms/room-forms";
import { RoomClient, type Projection } from "@/components/room/room-client";
import { Badge } from "@/components/ui/badge";
import { pathWithReturn } from "@/domain/navigation";
import { taskStatusLabel } from "@/presentation/labels";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const returnPath = `/${slug}`;
  const user = await getCurrentUser();
  if (!user) redirect(pathWithReturn("/", returnPath));
  if (!user.name) redirect(pathWithReturn("/onboarding", returnPath));
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  if (room.status === "FINISHED") {
    const summary = await roomSummary(room.id);
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <AppNavigation />
        <header>
          <Badge>Sala finalizada</Badge>
          <h1 className="mt-2 text-3xl font-bold">{room.name}</h1>
          <p className="text-zinc-500">Resumo somente leitura</p>
        </header>
        {summary.tasks.map((t) => (
          <Card key={t.id}>
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="font-semibold">{t.title}</h2>
                <a
                  className="text-sm underline"
                  href={t.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir tarefa
                </a>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge>{taskStatusLabel(t.status)}</Badge>
                <Badge>{t.finalResult ? `Resultado: ${t.finalResult}` : "Sem resultado"}</Badge>
              </div>
            </div>
            {t.rounds.map((r) => (
              <div key={r.sequence} className="mt-4 border-t pt-3">
                <div className="text-xs text-zinc-500">Rodada {r.sequence}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.votes.map((v, i) => (
                    <Badge key={i}>
                      {v.name}: {v.value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  }

  if (!(await getMembership(room.id, user.id)))
    return (
      <div className="mx-auto max-w-md space-y-4 p-4 md:p-8">
        <AppNavigation />
        <Card>
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p className="mb-6 mt-2 text-sm text-zinc-500">
            Informe a senha para entrar como participante.
          </p>
          <JoinRoomForm roomId={room.id} />
        </Card>
      </div>
    );
  return (
    <RoomClient
      roomId={room.id}
      initial={(await roomProjection(room.id, user.id)) as Projection}
    />
  );
}
