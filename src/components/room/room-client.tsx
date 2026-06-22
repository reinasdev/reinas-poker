"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { taskStatusLabel } from "@/presentation/labels";
export type Projection = {
  room: {
    id: string;
    name: string;
    slug: string;
    style: string;
    status: string;
  };
  isAdmin: boolean;
  member: { id: string };
  deck: readonly string[];
  tasks: Array<{
    id: string;
    title: string;
    link: string;
    status: string;
    finalResult?: string | null;
  }>;
  participants: Array<{
    id: string;
    name: string | null;
    hasVoted: boolean;
    vote?: string;
  }>;
  round: { status: string; sequence: number } | null;
};
export function RoomClient({
  roomId,
  initial,
}: {
  roomId: string;
  initial: Projection;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const r = await fetch(`/api/rooms/${roomId}/projection`, {
      cache: "no-store",
    });
    if (r.ok) {
      const projection = (await r.json()) as Projection;
      if (projection.room.status === "FINISHED") router.refresh();
      else setData(projection);
    }
  }, [roomId, router]);
  useEffect(() => {
    const es = new EventSource(`/api/rooms/${roomId}/events`);
    es.addEventListener("invalidate", refresh);
    es.onerror = () => void refresh();
    const recovery = setInterval(() => void refresh(), 30_000);
    return () => {
      clearInterval(recovery);
      es.close();
    };
  }, [roomId, refresh]);
  async function command(payload: unknown) {
    setError("");
    const r = await fetch(`/api/rooms/${roomId}/commands`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await r.json();
    if (!r.ok) setError(out.message);
    else if ((payload as { action?: string }).action === "room.finish")
      router.refresh();
    else await refresh();
  }
  const current = data.tasks.find((t) => t.status === "VOTING");
  const pending = data.tasks.filter((t) => t.status !== "COMPLETED");
  function move(taskId: string, delta: number) {
    const ids = pending.map((t) => t.id);
    const from = ids.indexOf(taskId),
      to = from + delta;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    command({ action: "task.reorder", ids });
  }
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <AppNavigation />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{data.room.name}</h1>
            <Badge>Sala ativa</Badge>
          </div>
          <p className="text-sm text-zinc-500">
            /{data.room.slug} · {data.room.style}
          </p>
        </div>
        {data.isAdmin && (
          <Button
            variant="danger"
            onClick={() => command({ action: "room.finish" })}
          >
            Finalizar sala
          </Button>
        )}
      </header>
      {error && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-red-700"
        >
          {error}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <Card>
            <h2 className="mb-1 text-lg font-semibold">
              {current?.title ?? "Nenhuma tarefa na fila"}
            </h2>
            {current && (
              <a
                className="text-sm underline"
                target="_blank"
                rel="noreferrer"
                href={current.link}
              >
                Abrir tarefa
              </a>
            )}
            {current && data.round && (
              <>
                <div className="my-6 flex flex-wrap gap-2">
                  {data.deck.map((v) => (
                    <Button
                      key={v}
                      variant="outline"
                      disabled={data.round?.status !== "OPEN"}
                      onClick={() => command({ action: "vote.cast", value: v })}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
                {data.isAdmin && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={data.round.status !== "OPEN"}
                      onClick={() => command({ action: "round.reveal" })}
                    >
                      Revelar votos
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => command({ action: "round.restart" })}
                    >
                      Reiniciar
                    </Button>
                    {data.round.status === "REVEALED" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => command({ action: "task.complete" })}
                        >
                          Sem consenso
                        </Button>
                        {data.deck.map((v) => (
                          <Button
                            key={`result-${v}`}
                            variant="ghost"
                            onClick={() =>
                              command({ action: "task.complete", result: v })
                            }
                          >
                            Concluir: {v}
                          </Button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold">Participantes</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.participants.map((p) => (
                <div
                  className="flex items-center justify-between rounded border p-3"
                  key={p.id}
                >
                  <span>{p.name ?? "Participante"}</span>
                  <Badge>
                    {p.vote ?? (p.hasVoted ? "Votou" : "Aguardando")}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </section>
        <aside>
          <Card>
            <h2 className="mb-4 font-semibold">Fila de tarefas</h2>
            {data.tasks.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma tarefa na fila</p>
            ) : (
              <ol className="space-y-2">
                {data.tasks.map((t) => (
                  <li className="rounded border p-3 text-sm" key={t.id}>
                    <div className="font-medium">{t.title}</div>
                    <Badge>{taskStatusLabel(t.status)}</Badge>
                    {data.isAdmin && t.status !== "COMPLETED" && (
                      <div className="mt-2 flex flex-wrap">
                        <Button
                          className="h-8"
                          variant="ghost"
                          aria-label="Mover para cima"
                          onClick={() => move(t.id, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          className="h-8"
                          variant="ghost"
                          aria-label="Mover para baixo"
                          onClick={() => move(t.id, 1)}
                        >
                          ↓
                        </Button>
                        <Button
                          className="h-8"
                          variant="ghost"
                          onClick={() => {
                            const title = window.prompt("Título", t.title),
                              link = window.prompt("Link", t.link);
                            if (title && link)
                              command({
                                action: "task.edit",
                                taskId: t.id,
                                title,
                                link,
                              });
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          className="h-8"
                          variant="ghost"
                          onClick={() =>
                            command({ action: "task.remove", taskId: t.id })
                          }
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {data.isAdmin && (
              <form
                className="mt-5 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  command({
                    action: "task.add",
                    title: f.get("title"),
                    link: f.get("link"),
                  });
                  e.currentTarget.reset();
                }}
              >
                <Input name="title" placeholder="Título da tarefa" required />
                <Input
                  name="link"
                  type="url"
                  placeholder="https://..."
                  required
                />
                <Button className="w-full">Adicionar tarefa</Button>
              </form>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
