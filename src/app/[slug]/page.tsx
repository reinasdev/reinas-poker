import { redirect } from "next/navigation";
import { getCurrentUser } from "@/application/auth";
import {
  getMembership,
  getRoomBySlug,
  joinRoom,
  roomProjection,
  roomSummary,
} from "@/application/rooms";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { Card } from "@/components/ui/card";
import { JoinRoomForm } from "@/components/forms/room-forms";
import { RoomClient, type Projection } from "@/components/room/room-client";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { TaskLink } from "@/components/ui/task-link";
import { VoteValue } from "@/components/ui/vote-value";
import { pathWithReturn } from "@/domain/navigation";
import { roomPasswordSchema } from "@/domain/validation";
import { taskStatusLabel } from "@/presentation/labels";

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
  const slug = (await params).slug;
  const { senha } = await searchParams;
  const returnPath = senha
    ? `/${slug}?senha=${encodeURIComponent(senha)}`
    : `/${slug}`;
  const room = await getRoomBySlug(slug);
  if (!room) redirect("/");

  const user = await getCurrentUser();
  if (!user) redirect(pathWithReturn("/", returnPath));
  if (!user.name) redirect(pathWithReturn("/onboarding", returnPath));

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
          {summary.tasks.map((t) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="font-semibold">{t.title}</h2>
                  <TaskLink href={t.link} />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge variant={taskBadgeVariant(t.status)}>
                    {taskStatusLabel(t.status)}
                  </Badge>
                  <Badge variant={t.finalResult ? "result" : "pending"}>
                    {t.finalResult ? (
                      <>
                        Resultado: <VoteValue value={t.finalResult} />
                      </>
                    ) : (
                      "Sem resultado"
                    )}
                  </Badge>
                </div>
              </div>
              {t.rounds.map((r) => (
                <div
                  key={r.sequence}
                  className="mt-4 border-t border-[var(--border)] pt-4"
                >
                  <div className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Rodada {r.sequence}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.votes.map((v, i) => (
                      <Badge key={i} variant="technical">
                        {v.name}: <VoteValue value={v.value} />
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
    if (password.success) {
      let joined = false;
      try {
        await joinRoom(user.id, room.id, password.data);
        joined = true;
      } catch {
        // Fall back to the manual password form for expired, invalid or closed rooms.
      }
      if (joined) redirect(`/${slug}`);
    }
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
        <AppNavigation userName={user.name} />
        <Card className="w-full border-[var(--technical-border)]">
          <div className="max-w-md">
            <div className="mb-6 space-y-2">
              <Badge variant="technical">/{room.slug}</Badge>
              <p className="text-xs font-semibold uppercase text-[var(--primary)]">
                rooms.access
              </p>
              <h1 className="text-2xl font-bold">{room.name}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Informe a senha para entrar como participante.
              </p>
            </div>
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
      initial={(await roomProjection(room.id, user.id)) as Projection}
    />
  );
}
