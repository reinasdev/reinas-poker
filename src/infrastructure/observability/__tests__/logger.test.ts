import { describe, expect, it, vi } from "vitest";
import { logRequestError, metricValue, structuredLog } from "../logger";

describe("safe observability", () => {
  it("logs structured metadata without error messages or secrets", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logRequestError(new Error("code=123456 token=secret password=1234 vote=13"));
    const output = String(spy.mock.calls[0][0]);
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      level: "error",
      event: "http.request.error",
      errorType: "Error",
    });
    expect(parsed).not.toHaveProperty("message");
    expect(parsed).not.toHaveProperty("stack");
    expect(output).not.toMatch(/123456|secret|password|vote=/);
    expect(metricValue("http.request.error")).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it("writes JSON info events", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    structuredLog("info", "app.ready", { healthy: true });
    expect(JSON.parse(String(spy.mock.calls[0][0]))).toMatchObject({ event: "app.ready", healthy: true });
    spy.mockRestore();
  });
});
