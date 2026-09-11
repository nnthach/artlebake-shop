import { OrderQueueEnum } from "@/enums/order-queue.enum";
import { sendOrderConfirmationEmail } from "../../../lib/emails/send-order-confirmation";
import { redisProtocol } from "@/worker/src/config/redis";
import { Worker } from "bullmq";
import { supabaseAdmin } from "@/lib/supabase";

export const orderWorker = new Worker(
  "orders",
  async (job) => {
    switch (job.name) {
      case OrderQueueEnum.SendEmailOrderConfirmation:
        console.log("================================");
        console.log("[Worker] Job received");
        console.log("[Worker] Job ID:", job.id);
        console.log("[Worker] Job name:", job.name);
        console.log("[Worker] Job data:", job.data);
        await sendOrderConfirmationEmail(job.data);
        break;
      case OrderQueueEnum.CancelExpirePaymentOrder: {
        const { orderId } = job.data;

        const { error } = await supabaseAdmin.rpc(
          "cancel_order_and_release_stock",
          {
            p_order_id: orderId,
          },
        );

        if (error) {
          throw error;
        }

        break;
      }

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
