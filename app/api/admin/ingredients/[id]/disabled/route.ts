import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Id is required" },
        { status: 400 },
      );
    }

    const { data: ingredient, error } = await supabaseAdmin
      .from("ingredients")
      .update({ is_active: false })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: "Ingredient not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Ingredient disabled successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Disable ingredient error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disable ingredient" },
      { status: 500 },
    );
  }
}
