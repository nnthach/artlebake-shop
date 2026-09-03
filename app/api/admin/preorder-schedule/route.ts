import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  supabaseAdmin,
} from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createScheduleSchema = z.object({
  date: z.string().date(),
  status: z.boolean().default(true),
});

const updateScheduleSchema = z.object({
  id: z.string().uuid(),
  date: z.string().date().optional(),
  status: z.boolean().optional(),
});

async function getAuthenticatedUser(req: NextRequest) {
  const response = new NextResponse(null);

  const supabase = createSupabaseServerClient(req, response);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response,
    };
  }

  return {
    user,
    response,
  };
}

/**
 * GET
 *
 * GET /api/admin/preorder-schedules
 *
 * Optional:
 * ?start_date=2026-08-01
 * &end_date=2026-08-31
 *
 * Hoặc:
 * ?date=2026-08-30
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("preorder_schedules")
      .select("*")
      .order("date", { ascending: true });

    // Get specific date
    if (date) {
      query = query.eq("date", date);
    }

    // Get date range
    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    if (status !== null && status !== "") {
      query = query.eq("status", status === "true");
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch preorder schedules error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Authentication
    const { user } = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await req.json();

    const parsed = createScheduleSchema.safeParse(body);

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

    const { date, status } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("preorder_schedules")
      .insert({
        date,
        status,
      })
      .select()
      .single();

    if (error) {
      // PostgreSQL unique violation
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "A preorder schedule already exists for this date",
          },
          { status: 409 },
        );
      }

      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create preorder schedule error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH
 *
 * Update schedule
 *
 * Body:
 * {
 *   "id": "uuid",
 *   "status": false
 * }
 */
export async function PATCH(req: NextRequest) {
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

    // Authentication
    const { user } = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await req.json();

    const parsed = updateScheduleSchema.safeParse(body);

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

    const { id, date, status } = parsed.data;

    if (date === undefined && status === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Nothing to update",
        },
        { status: 400 },
      );
    }

    const updateData: {
      date?: string;
      status?: boolean;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (date !== undefined) {
      updateData.date = date;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const { data, error } = await supabaseAdmin
      .from("preorder_schedules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Preorder schedule not found",
          },
          { status: 404 },
        );
      }

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "A preorder schedule already exists for this date",
          },
          { status: 409 },
        );
      }

      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update preorder schedule error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE
 *
 * DELETE /api/admin/preorder-schedules?id=uuid
 */
export async function DELETE(req: NextRequest) {
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

    // Authentication
    const { user } = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Schedule id is required",
        },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("preorder_schedules")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete preorder schedule error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
