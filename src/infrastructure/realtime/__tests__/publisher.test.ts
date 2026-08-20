import { describe, expect, it } from "vitest";
import { roomPublisher } from "../publisher";
describe("room publisher", () => {
  it("publishes invalidation metadata after the current call stack", async () => {
    const events: unknown[] = [];
    const stop = roomPublisher.subscribe("r1", (e) => events.push(e));
    roomPublisher.publishAfterCommit({
      type: "vote.cast",
      roomId: "r1",
      at: new Date().toISOString(),
    });
    expect(events).toHaveLength(0);
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(events).toHaveLength(1);
    expect(events[0]).not.toHaveProperty("vote");
    stop();
  });
});
describe("room event isolation and reconnection", () => {
  it("delivers only to the subscribed room and supports resubscription", async () => {
    const first: unknown[] = [],
      second: unknown[] = [];
    const stop = roomPublisher.subscribe("room-a", (event) =>
      first.push(event),
    );
    roomPublisher.subscribe("room-b", (event) => second.push(event));
    roomPublisher.publishAfterCommit({
      type: "vote.cast",
      roomId: "room-a",
      at: new Date().toISOString(),
    });
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    stop();
    const reconnected: unknown[] = [];
    roomPublisher.subscribe("room-a", (event) => reconnected.push(event));
    roomPublisher.publishAfterCommit({
      type: "round.revealed",
      roomId: "room-a",
      at: new Date().toISOString(),
    });
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(reconnected).toHaveLength(1);
    expect(reconnected[0]).not.toHaveProperty("value");
  });
});
