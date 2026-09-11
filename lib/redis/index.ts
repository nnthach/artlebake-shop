// import { Redis } from "@upstash/redis";

// export const redisCache = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

import Redis from "ioredis";

export const redisCache = new Redis(process.env.AIVEN_REDIS_URI!);
