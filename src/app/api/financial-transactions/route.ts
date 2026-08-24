import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_THRESHOLD = 2500;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const kitPhaseId = req.nextUrl.searchParams.get("kitPhaseId");
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  const pageSize = 25;

  if (!kitPhaseId) {
    return NextResponse.json({ error: "Missing kitPhaseId." }, { status: 400 });
  }

  const { data, error, count } = await supabase
    .from("client_financial_transactions")
    .select("*", { count: "exact" })
    .eq("client_id", user.id)
    .eq("kit_phase_id", kitPhaseId)
    .order("transaction_date", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    return NextResponse.json({ error: "Could not load transactions.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    transactions: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}

function computeFlag(amount: number, authorizationExists: boolean): boolean {
  return amount > DEFAULT_THRESHOLD && !authorizationExists;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { kitPhaseId, transactionDate, amount, description, authorizationExists, authorizationRef } = await req.json();
  if (!kitPhaseId || !transactionDate || amount === undefined || !description?.trim()) {
    return NextResponse.json({ error: "Missing required transaction fields." }, { status: 400 });
  }

  const { error } = await supabase.from("client_financial_transactions").insert({
    client_id: user.id,
    kit_phase_id: kitPhaseId,
    transaction_date: transactionDate,
    amount,
    description: description.trim(),
    authorization_exists: Boolean(authorizationExists),
    authorization_ref: authorizationRef ?? null,
    flagged: computeFlag(amount, Boolean(authorizationExists)),
  });

  if (error) {
    return NextResponse.json({ error: "Could not save transaction.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
