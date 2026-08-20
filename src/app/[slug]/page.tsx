import { redirect } from "next/navigation";
import { Badge, Card, CardHeader, type BadgeVariant } from "@reinas/ui";
import { getCurrentUser, loginUrl } from "@/application/auth";
import {
  getMembership,
  getRoomBySlug,
  joinRoom,
  roomProjection,
  roomSummary,
} from "@/application/rooms";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { JoinRoomForm } from "@/components/forms/room-forms";
import { RoomClient } from "@/components/room/room-client";
import { TaskLink } from "@/components/room/task-link";
import { VoteValue } from "@/components/room/vote-value";
import type { Projection } from "@/components/room/types";
import { roomPasswordSchema } from "@/domain/validation";
import { env } from "@/infrastructure/config/env";
import { taskStatusLabel } from "@/presentation/labels";

export const dynamic = "force-dynamic";

function taskBadgeVariant(status: string): BadgeVariant {
  if (status === "COMPLETED") return "completed";
  if (status === "VOTING") return "voting";
  return "pending";
}

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ senha?: string }>;
}) {
  const { slug } = await params;
  const { senha } = await searchParams;
  const returnPath = senha
    ? `/${slug}?senha=${encodeURIComponent(senha)}`
    : `/${slug}`;

  const [room, user] = await Promise.all([
    getRoomBySlug(slug),
    getCurrentUser(),
  ]);
  if (!room) redirect("/");
  if (!user?.name) redirect(loginUrl(returnPath));

  if (room.status === "FINISHED") {
    const summary = await roomSummary(room.id);
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
        <AppNavigation userName={user.name} />
        <header className="space-y-3">
          <Badge variant="finished">Sala finalizada</Badge>
          <div>
            <h1 className="text-3xl font-bold">{room.name}</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Resumo somente leitura
            </p>
          </div>
        </header>
        <div className="space-y-4">
          {summary.tasks.map((task) => (
            <Card key={task.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="font-semibold">{task.title}</h2>
                  <TaskLink href={task.link} />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge variant={taskBadgeVariant(task.status)}>
                    {taskStatusLabel(task.status)}
                  </Badge>
                  <Badge variant={task.finalResult ? "result" : "pending"}>
                    {task.finalResult ? (
                      <>
                        Resultado: <VoteValue value={task.finalResult} />
                      </>
                    ) : (
                      "Sem resultado"
                    )}
                  </Badge>
                </div>
              </div>
              {task.rounds.map((round) => (
                <div
                  key={round.sequence}
                  className="mt-4 border-t border-[var(--border)] pt-4"
                >
                  <div className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Rodada {round.sequence}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {round.votes.map((vote, index) => (
                      <Badge key={index} variant="technical">
                        {vote.name}: <VoteValue value={vote.value} />
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!(await getMembership(room.id, user.id))) {
    const password = roomPasswordSchema.safeParse(senha);
    let joined = false;
    if (password.success) {
      try {
        await joinRoom(user.id, room.id, password.data);
        joined = true;
      } catch {
        // Cai no formulário manual para senha inválida ou sala encerrada.
      }
    }
    if (joined) redirect(`/${slug}`);

    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
        <AppNavigation userName={user.name} />
        <Card tone="technical" className="w-full">
          <div className="max-w-md">
            <Badge variant="technical">/{room.slug}</Badge>
            <CardHeader
              className="mt-2"
              eyebrow="rooms.access"
              title={<span className="text-2xl font-bold">{room.name}</span>}
              description="Informe a senha para entrar como participante."
            />
            <JoinRoomForm roomId={room.id} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <RoomClient
      roomId={room.id}
      currentUserName={user.name}
      origin={new URL(env.APP_URL).origin}
      initial={(await roomProjection(room.id, user.id)) as Projection}
    />
  );
}
