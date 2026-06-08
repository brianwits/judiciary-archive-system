/** Naive sliding-window rate limiter for server-side abuse reduction (single-process / per-instance on serverless). */
const buckets = new Map<string, number[]>();

function pruneStaleEntries(nowMs: number, windowMs: number) {
  if (buckets.size < 8000) return;
  for (const [k, timestamps] of buckets) {
    if (timestamps.every((t) => nowMs - t >= windowMs)) buckets.delete(k);
  }
}

/**
 * @returns false when the key exceeds the limit within the window
 */
export function allowRateLimited(
  key: string,
  options: { max: number; windowMs: number },
): boolean {
  const now = Date.now();
  const { max, windowMs } = options;
  const timestamps = buckets.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  pruneStaleEntries(now, windowMs);
  return true;
}

export function forwardedOrRealIp(forwardedFor: string | null, realIp: string | null): string {
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();
  return firstForwarded || realIp || "unknown";
}
