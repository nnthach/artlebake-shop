import { Queue } from "bullmq";
import { redisProtocol } from "./redis-queue";

export const orderQueue = new Queue("orders", {
  connection: redisProtocol,
});
