"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TaskLink } from "@/components/ui/task-link";
import { VoteValue } from "@/components/ui/vote-value";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { taskStatusLabel } from "@/presentation/labels";
import { cn } from "@/lib/utils";

export type Projection = {
  room: {
    id: string;
    name: string;
    slug: string;
    style: string;
    status: string;
    accessCode?: string | null;
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
  selectedVote?: string;
};

function taskBadgeVariant(status: string): BadgeVariant {
  if (status === "COMPLETED") return "completed";
  if (status === "VOTING") return "voting";
  return "pending";
}

export function RoomClient({
  roomId,
  currentUserName,
  initial,
}: {
  roomId: string;
  currentUserName?: string | null;
  initial: Projection;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);
  const [shareOrigin, setShareOrigin] = useState("");
  const baseSharePath = `/${data.room.slug}`;
  const baseShareUrl = `${shareOrigin}${baseSharePath}`;
  const shareUrl = data.room.accessCode
    ? `${baseShareUrl}?senha=${encodeURIComponent(data.room.accessCode)}`
    : baseShareUrl;

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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setShareOrigin(window.location.origin);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
      window.location.assign(`/${data.room.slug}`);
    else await refresh();
  }

  async function copyInvite() {
    const clipboardUrl = data.room.accessCode
      ? `${window.location.origin}${baseSharePath}?senha=${encodeURIComponent(
          data.room.accessCode,
        )}`
      : `${window.location.origin}${baseSharePath}`;
    await navigator.clipboard.writeText(
      `Entre aqui na votação: ${clipboardUrl}\nSenha de acesso: ${
        data.room.accessCode ?? "indisponível"
      }`,
    );
    setCopiedShare(true);
    window.setTimeout(() => setCopiedShare(false), 2200);
  }

  const current = data.tasks.find((t) => t.status === "VOTING");
  const pending = data.tasks.filter((t) => t.status !== "COMPLETED");

  function move(taskId: string, delta: number) {
    const ids = pending.map((t) => t.id);
    const from = ids.indexOf(taskId);
    const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    command({ action: "task.reorder", ids });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <AppNavigation userName={currentUserName} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">
            rooms.current
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{data.room.name}</h1>
            <Badge variant="active">Sala ativa</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="technical">/{data.room.slug}</Badge>
            <Badge>{data.room.style}</Badge>
            {data.round && (
              <Badge
                variant={data.round.status === "REVEALED" ? "result" : "voting"}
              >
                Rodada {data.round.sequence} · {data.round.status}
              </Badge>
            )}
          </div>
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
          className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] p-3 text-sm text-[var(--foreground)]"
        >
          {error}
        </p>
      )}

      {data.isAdmin && (
        <Card className="border-[var(--technical-border)]">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_132px] md:items-center">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--primary)]">
                  rooms.share
                </p>
                <h2 className="mt-1 font-semibold">Compartilhar sala</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--border-strong)] bg-[var(--technical)] p-3">
                  <p className="text-xs uppercase text-[var(--muted)]">link</p>
                  <p className="mt-1 truncate text-sm text-[var(--foreground)]">
                    {shareUrl}
                  </p>
                </div>
                <div className="rounded-md border border-[var(--border-strong)] bg-[var(--technical)] p-3">
                  <p className="text-xs uppercase text-[var(--muted)]">senha</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {data.room.accessCode ?? "indisponível"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={copyInvite}>
                  Copiar convite
                </Button>
                <span
                  aria-live="polite"
                  className="text-xs text-[var(--muted-foreground)]"
                >
                  {copiedShare ? "Convite copiado." : ""}
                </span>
              </div>
            </div>
            <div className="flex h-32 w-32 items-center justify-center rounded-md border border-[var(--border-strong)] bg-white p-2">
              <QRCodeSVG
                value={shareUrl}
                size={112}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                aria-label="QR code da sala"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <Card className="border-[var(--technical-border)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[var(--primary)]">
                  current.task
                </p>
                <h2 className="text-xl font-semibold">
                  {current?.title ?? "Nenhuma tarefa na fila"}
                </h2>
                {current && <TaskLink href={current.link} />}
              </div>
              {current && data.round && (
                <Badge
                  variant={
                    data.round.status === "REVEALED" ? "result" : "voting"
                  }
                >
                  {data.round.status === "REVEALED"
                    ? "Votos revelados"
                    : "Votação aberta"}
                </Badge>
              )}
            </div>

            {current && data.round && (
              <>
                <div className="my-6 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
                  {data.deck.map((v) => {
                    const isSelected = data.selectedVote === v;
                    return (
                      <Button
                        key={v}
                        variant="technical"
                        className={cn(
                          "h-14 text-lg",
                          isSelected &&
                            "vote-card-selected ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--background)]",
                        )}
                        aria-pressed={isSelected}
                        disabled={data.round?.status !== "OPEN"}
                        onClick={() =>
                          command({ action: "vote.cast", value: v })
                        }
                      >
                        <VoteValue value={v} />
                      </Button>
                    );
                  })}
                </div>
                {data.isAdmin && (
                  <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
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
                            Concluir: <VoteValue value={v} />
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--primary)]">
                  participants
                </p>
                <h2 className="mt-1 font-semibold">Participantes</h2>
              </div>
              <Badge>{data.participants.length} online</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.participants.map((p) => {
                const hasRevealedVote = Boolean(p.vote);
                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
                    key={p.id}
                  >
                    <span className="min-w-0 truncate text-sm">
                      {p.name ?? "Participante"}
                    </span>
                    <Badge
                      variant={
                        hasRevealedVote
                          ? "result"
                          : p.hasVoted
                            ? "active"
                            : "pending"
                      }
                    >
                      {p.vote ?? (p.hasVoted ? "Votou" : "Aguardando")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <aside>
          <Card className="lg:sticky lg:top-6">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase text-[var(--primary)]">
                task.queue
              </p>
              <h2 className="mt-1 font-semibold">Fila de tarefas</h2>
            </div>
            {data.tasks.length === 0 ? (
              <p className="rounded-md border border-[var(--border)] bg-[var(--technical)] p-3 text-sm text-[var(--muted-foreground)]">
                Nenhuma tarefa na fila
              </p>
            ) : (
              <ol className="space-y-2">
                {data.tasks.map((t) => (
                  <li
                    className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
                    key={t.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{t.title}</div>
                        {t.finalResult && (
                          <Badge className="mt-2" variant="result">
                            Resultado: {t.finalResult}
                          </Badge>
                        )}
                      </div>
                      <Badge variant={taskBadgeVariant(t.status)}>
                        {taskStatusLabel(t.status)}
                      </Badge>
                    </div>
                    {data.isAdmin && t.status !== "COMPLETED" && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        <Button
                          className="h-8 w-8 px-0"
                          variant="ghost"
                          aria-label="Mover para cima"
                          onClick={() => move(t.id, -1)}
                        >
                          <ArrowUp size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          className="h-8 w-8 px-0"
                          variant="ghost"
                          aria-label="Mover para baixo"
                          onClick={() => move(t.id, 1)}
                        >
                          <ArrowDown size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          className="h-8 w-8 px-0"
                          variant="ghost"
                          aria-label="Editar tarefa"
                          onClick={() => {
                            const title = window.prompt("Título", t.title);
                            const link = window.prompt("Link", t.link);
                            if (title && link)
                              command({
                                action: "task.edit",
                                taskId: t.id,
                                title,
                                link,
                              });
                          }}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          className="h-8 w-8 px-0"
                          variant="ghost"
                          aria-label="Remover tarefa"
                          onClick={() =>
                            command({ action: "task.remove", taskId: t.id })
                          }
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {data.isAdmin && (
              <form
                className="mt-5 space-y-2 border-t border-[var(--border)] pt-4"
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
