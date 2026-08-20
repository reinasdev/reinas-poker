type LogLevel = "info" | "error";
type SafeFields = Record<string, string | number | boolean | undefined>;

const counters = new Map<string, number>();

export function incrementMetric(name: string) {
  counters.set(name, (counters.get(name) ?? 0) + 1);
}

export function metricValue(name: string) {
  return counters.get(name) ?? 0;
}

export function structuredLog(
  level: LogLevel,
  event: string,
  fields: SafeFields = {},
) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === "error") console.error(entry);
  else console.info(entry);
}

export function logRequestError(error: unknown) {
  incrementMetric("http.request.error");
  structuredLog("error", "http.request.error", {
    errorType: error instanceof Error ? error.name : "UnknownError",
    errorCode:
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined,
  });
}
