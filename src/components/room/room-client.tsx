"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button } from "@reinas/ui";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { CurrentTask } from "./current-task";
import { Participants } from "./participants";
import { ShareCard } from "./share-card";
import { TaskQueue } from "./task-queue";
import type { Projection, RoomCommand } from "./types";

export type { Projection } from "./types";

/** Rajadas de eventos viram uma única releitura. */
const COALESCE_MS = 120;
/** Rede de segurança quando a aba está visível e o SSE silenciou. */
const RECOVERY_MS = 60_000;

export function RoomClient({
  roomId,
  currentUserName,
  initial,
  origin,
}: {
  roomId: string;
  currentUserName?: string | null;
  initial: Projection;
  /** Origem pública da aplicação, usada no convite e no QR code. */
  origin: string;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");

  const etag = useRef<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const pendingRefresh = useRef<number | null>(null);

  /**
   * Relê a projeção. O `If-None-Match` faz o servidor responder 304 quando
   * nada mudou, então o estado não é tocado e a árvore não re-renderiza.
   */
  const refresh = useCallback(async () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    try {
      const response = await fetch(`/api/rooms/${roomId}/projection`, {
        cache: "no-store",
        signal: controller.signal,
        headers: etag.current ? { "if-none-match": etag.current } : undefined,
      });
      if (response.status === 304) return;
      if (!response.ok) return;

      etag.current = response.headers.get("etag");
      const projection = (await response.json()) as Projection;
      if (projection.room.status === "FINISHED") router.refresh();
      else setData(projection);
    } catch {
      // Abortos e quedas de rede são recuperados pelo próximo evento ou ciclo.
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
    }
  }, [roomId, router]);

  const scheduleRefresh = useCallback(() => {
    if (pendingRefresh.current !== null) return;
    pendingRefresh.current = window.setTimeout(() => {
      pendingRefresh.current = null;
      void refresh();
    }, COALESCE_MS);
  }, [refresh]);

  useEffect(() => {
    const source = new EventSource(`/api/rooms/${roomId}/events`);
    source.addEventListener("invalidate", scheduleRefresh);
    source.onerror = scheduleRefresh;

    const recovery = window.setInterval(() => {
      if (document.visibilityState === "visible") scheduleRefresh();
    }, RECOVERY_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(recovery);
      document.removeEventListener("visibilitychange", onVisible);
      if (pendingRefresh.current !== null)
        window.clearTimeout(pendingRefresh.current);
      pendingRefresh.current = null;
      inFlight.current?.abort();
      source.close();
    };
  }, [roomId, scheduleRefresh]);

  const command = useCallback(
    async (payload: RoomCommand) => {
      setError("");
      const response = await fetch(`/api/rooms/${roomId}/commands`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message);
        return;
      }
      if (payload.action === "room.finish") router.refresh();
      else await refresh();
    },
    [roomId, refresh, router],
  );

  const castVote = useCallback(
    (value: string) => void command({ action: "vote.cast", value }),
    [command],
  );

  const pending = useMemo(
    () => data.tasks.filter((task) => task.status !== "COMPLETED"),
    [data.tasks],
  );
  const current = useMemo(
    () => data.tasks.find((task) => task.status === "VOTING"),
    [data.tasks],
  );

  const move = useCallback(
    (taskId: string, delta: number) => {
      const ids = pending.map((task) => task.id);
      const from = ids.indexOf(taskId);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= ids.length) return;
      [ids[from], ids[to]] = [ids[to], ids[from]];
      void command({ action: "task.reorder", ids });
    },
    [pending, command],
  );

  const finishRoom = useCallback(
    () => void command({ action: "room.finish" }),
    [command],
  );

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
          <Button variant="danger" onClick={finishRoom}>
            Finalizar sala
          </Button>
        )}
      </header>

      <Alert>{error}</Alert>

      {data.isAdmin && (
        <ShareCard
          slug={data.room.slug}
          accessCode={data.room.accessCode}
          origin={origin}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <CurrentTask
            task={current}
            round={data.round}
            deck={data.deck}
            selectedVote={data.selectedVote}
            isAdmin={data.isAdmin}
            onCommand={command}
            onVote={castVote}
          />
          <Participants participants={data.participants} />
        </section>

        <aside>
          <TaskQueue
            tasks={data.tasks}
            isAdmin={data.isAdmin}
            onCommand={command}
            onMove={move}
          />
        </aside>
      </div>
    </div>
  );
}
