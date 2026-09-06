import { redisProtocol } from "@/worker/src/config/redis";
import { Queue } from "bullmq";

export const orderQueue = new Queue("orders", {
  connection: redisProtocol,
});
