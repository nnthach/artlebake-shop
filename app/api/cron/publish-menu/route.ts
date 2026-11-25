import { deleteCacheByResource } from "@/lib/redis-cache";
import { supabaseAdmin } from "@/lib/supabase";
import { proxyFastApiCron } from "@/lib/fastapi/operations";

export async function POST() {
  const fastApiResponse = await proxyFastApiCron("publish-menu");
  if (fastApiResponse) return fastApiResponse;

  const { error } = await supabaseAdmin.rpc("publish_daily_menu");

  if (error) throw error;

  void deleteCacheByResource("products");

  return Response.json({ success: true });
}
