export function safeReturnPath(
  value: string | null | undefined,
  fallback = "/rooms",
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return fallback;
  return value;
}

export function pathWithReturn(destination: string, nextPath: string) {
  return `${destination}?next=${encodeURIComponent(safeReturnPath(nextPath))}`;
}

export function authenticatedBackPath(pathname: string) {
  return pathname === "/rooms" ? null : "/rooms";
}
