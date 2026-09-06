import { Ratelimit } from "@upstash/ratelimit";
import { redisCache } from "./redis";

export function createRateLimit(
  requests: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
) {
  return new Ratelimit({
    redis: redisCache,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  });
}
