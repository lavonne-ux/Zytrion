import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  semi_annual: 182,
  annual: 365,
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("maintenance_items")
    .select("id, discipline, frequency, field_schema, log_entry_domain")
    .order("discipline");

  if (itemsError || !items) {
    return NextResponse.json({ error: "Could not load maintenance items." }, { status: 500 });
  }

  const { data: completions } = await supabase
    .from("client_maintenance_completions")
    .select("maintenance_item_id, completed_at")
    .eq("client_id", user.id)
    .order("completed_at", { ascending: false });

  const now = Date.now();
  const dashboard = items.map((item) => {
    const lastCompletion = completions?.find((c) => c.maintenance_item_id === item.id);
    const frequencyDays = FREQUENCY_DAYS[item.frequency] ?? 30;

    let status: "On Time" | "Upcoming" | "Overdue";
    let dueDate: string | null = null;

    if (!lastCompletion) {
      status = "Upcoming";
    } else {
      const lastDate = new Date(lastCompletion.completed_at).getTime();
      const dueDateMs = lastDate + frequencyDays * 86400000;
      dueDate = new Date(dueDateMs).toISOString();
      const daysUntilDue = (dueDateMs - now) / 86400000;
      if (daysUntilDue < 0) status = "Overdue";
      else if (daysUntilDue <= 7) status = "Upcoming";
      else status = "On Time";
    }

    return {
      id: item.id,
      discipline: item.discipline,
      frequency: item.frequency,
      fieldSchema: item.field_schema,
      status,
      dueDate,
      lastCompletedAt: lastCompletion?.completed_at ?? null,
    };
  });

  return NextResponse.json({ items: dashboard });
}
