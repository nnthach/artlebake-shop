import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updatePreorderItemSchema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 500 },
      );
    }

    const { id } = await params;

    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid preorder item id",
        },
        { status: 400 },
      );
    }

    const body = await req.json();

    const parsed = updatePreorderItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { is_active } = parsed.data;

    // Check preorder item exists
    const { error: findError } = await supabaseAdmin
      .from("preorder_items")
      .select(
        `
        id,
        is_active,
        schedule_id,
        preorder_schedules!inner(
          id,
          date,
          status
        )
        `,
      )
      .eq("id", id)
      .single();

    if (findError) {
      if (findError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Preorder item not found",
          },
          { status: 404 },
        );
      }

      throw findError;
    }

    // Update
    const { data, error: updateError } = await supabaseAdmin
      .from("preorder_items")
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        products(
          id,
          price,
          image_url,
          is_active,
          product_translations(locale, name, slug)
        ),
        preorder_schedules(
          id,
          date,
          status
        )
        `,
      )
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update preorder item error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
