import { DailyInventoryStatusEnum } from "@/enums/daily-inventory-status.enum";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { getBusinessDate } from "@/utils/logic-get";
import { NextResponse } from "next/server";

export async function PATCH() {
	try {
		if (!isSupabaseConfigured) {
			return NextResponse.json(
				{ success: false, error: "Database not configured" },
				{ status: 500 },
			);
		}

		const businessDate = getBusinessDate();

		const { data, error } = await supabaseAdmin
			.from("daily_inventories")
			.update({
				status: DailyInventoryStatusEnum.Available,
				is_active: true,
				updated_at: new Date().toISOString(),
			})
			.eq("business_date", businessDate)
			.select("*");

		if (error) {
			console.error("Publish daily inventories error:", error);
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Today's inventories marked as available",
			business_date: businessDate,
			updated_count: data?.length ?? 0,
			data: data ?? [],
		});
	} catch (error) {
		console.error("Publish daily inventories error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
