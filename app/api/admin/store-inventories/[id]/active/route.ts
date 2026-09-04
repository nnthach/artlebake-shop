import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function PATCH(
	_req: Request,
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
				{ success: false, error: "Inventory id is required" },
				{ status: 400 },
			);
		}

		const { data: inventory, error: inventoryError } = await supabaseAdmin
			.from("daily_inventories")
			.select("id, is_active")
			.eq("id", id)
			.maybeSingle();

		if (inventoryError) {
			console.error("Get inventory before activating error:", inventoryError);
			return NextResponse.json(
				{ success: false, error: inventoryError.message },
				{ status: 500 },
			);
		}

		if (!inventory) {
			return NextResponse.json(
				{ success: false, error: "Inventory not found" },
				{ status: 404 },
			);
		}

		if (inventory.is_active) {
			return NextResponse.json(
				{ success: false, error: "Inventory is already active" },
				{ status: 400 },
			);
		}

		const { data, error } = await supabaseAdmin
			.from("daily_inventories")
			.update({
				is_active: true,
				updated_at: new Date().toISOString(),
			})
			.eq("id", id)
			.select("*")
			.single();

		if (error) {
			console.error("Activate inventory error:", error);
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Inventory activated",
			data,
		});
	} catch (error) {
		console.error("Activate inventory error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
