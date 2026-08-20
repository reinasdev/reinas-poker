export type RoomEvent = {
  type:
    | "participant.joined"
    | "vote.cast"
    | "round.revealed"
    | "round.restarted"
    | "queue.changed"
    | "task.completed"
    | "room.finished";
  roomId: string;
  at: string;
};
export interface RoomEventPublisher {
  publishAfterCommit(event: RoomEvent): void;
  subscribe(roomId: string, listener: (event: RoomEvent) => void): () => void;
}
class InMemoryPublisher implements RoomEventPublisher {
  private listeners = new Map<string, Set<(event: RoomEvent) => void>>();
  publishAfterCommit(event: RoomEvent) {
    queueMicrotask(() =>
      this.listeners.get(event.roomId)?.forEach((fn) => fn(event)),
    );
  }
  subscribe(roomId: string, listener: (event: RoomEvent) => void) {
    const set = this.listeners.get(roomId) ?? new Set();
    set.add(listener);
    this.listeners.set(roomId, set);
    return () => set.delete(listener);
  }
}
const globalEvents = globalThis as unknown as {
  roomPublisher?: InMemoryPublisher;
};
export const roomPublisher =
  globalEvents.roomPublisher ?? new InMemoryPublisher();
globalEvents.roomPublisher = roomPublisher;
