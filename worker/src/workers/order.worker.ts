import { OrderQueueEnum } from "@/enums/order-queue.enum";
import { sendOrderConfirmationEmail } from "../../../lib/emails/send-order-confirmation";
import { redisProtocol } from "@/worker/src/config/redis";
import { Worker } from "bullmq";

export const orderWorker = new Worker(
  "orders",
  async (job) => {
    switch (job.name) {
      case OrderQueueEnum.SendEmailOrderConfirmation:
        await sendOrderConfirmationEmail(job.data);
        break;

      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  },
  {
    connection: redisProtocol,
    concurrency: 5,
  },
);

orderWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

orderWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});
