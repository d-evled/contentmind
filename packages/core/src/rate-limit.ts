export interface RateLimitOptions {
  now: number;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/** Counts request timestamps within the trailing window. */
export function checkRateLimit(
  timestamps: number[],
  { now, limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const cutoff = now - windowMs;
  const recent = timestamps.filter((t) => t > cutoff).length;
  const remaining = Math.max(0, limit - recent);
  return { allowed: recent < limit, remaining };
}
