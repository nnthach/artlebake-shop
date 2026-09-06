import { Queue } from "bullmq";
import { redisProtocol } from "./redis-queue";

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
