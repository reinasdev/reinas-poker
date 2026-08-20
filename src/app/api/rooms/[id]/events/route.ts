import { requireUser } from "@/application/auth";
import { getMembership } from "@/application/rooms";
import { roomPublisher } from "@/infrastructure/realtime/publisher";
export const dynamic = "force-dynamic";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const roomId = (await params).id;
  if (!(await getMembership(roomId, user.id)))
    return new Response("Forbidden", { status: 403 });
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (type: string) =>
        controller.enqueue(
          encoder.encode(
            `event: invalidate\ndata: ${JSON.stringify({ type })}\n\n`,
          ),
        );
      cleanup = roomPublisher.subscribe(roomId, (e) => send(e.type));
      send("connected");
      const heartbeat = setInterval(
        () => controller.enqueue(encoder.encode(": heartbeat\n\n")),
        15_000,
      );
      cleanup = (() => {
        const unsubscribe = cleanup;
        return () => {
          clearInterval(heartbeat);
          unsubscribe();
        };
      })();
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
