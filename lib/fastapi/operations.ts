import { post } from "./api";
import { FastApiHttpError, httpClient } from "./http-client";

export type FastApiCronEndpoint =
  | "close-daily-inventories"
  | "close-preorder"
  | "publish-menu";

function webhookFailure(status: number) {
  return Response.json(
    { error: -1, message: "Webhook processing failed" },
    { status },
  );
}

function webhookErrorStatus(error: unknown) {
  if (!(error instanceof FastApiHttpError)) return 502;
  if (error.status === 400 || error.status === 422) return 400;
  if (error.status === 503) return 503;
  return 502;
}

export async function proxyFastApiPayosWebhook(
  request: Request,
): Promise<Response | null> {
  if (process.env.FASTAPI_CHECKOUT_ENABLED !== "true") return null;
  if (!httpClient.isConfigured()) return webhookFailure(503);

  let body: string;
  try {
    body = await request.text();
  } catch {
    return webhookFailure(400);
  }

  try {
    return await post("/webhooks/payos", {
      body,
      headers: {
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    return webhookFailure(webhookErrorStatus(error));
  }
}

export async function proxyFastApiCron(
  endpoint: FastApiCronEndpoint,
): Promise<Response | null> {
  if (process.env.FASTAPI_CRON_ENABLED !== "true") return null;

  const cronSecret = process.env.CRON_SECRET;
  if (!httpClient.isConfigured() || !cronSecret) {
    return Response.json(
      { success: false, error: "Cron forwarding is not configured" },
      { status: 503 },
    );
  }

  try {
    return await post(`/cron/${endpoint}`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
  } catch (error) {
    const status =
      error instanceof FastApiHttpError && error.status >= 400 && error.status <= 599
        ? error.status
        : 502;
    return Response.json(
      { success: false, error: "FastAPI cron request failed" },
      { status },
    );
  }
}
