import { redisProtocol } from "@/lib/queues/redis-queue";
import { Queue } from "bullmq";

export const orderQueue = new Queue("orders", {
  connection: redisProtocol,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});
