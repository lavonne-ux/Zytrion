import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_THRESHOLD = 2500;
const MAX_ROWS = 500;

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

  const { kitPhaseId, rows } = await req.json();
  if (!kitPhaseId || !Array.isArray(rows)) {
    return NextResponse.json({ error: "Missing kitPhaseId or rows." }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows in one import. Maximum ${MAX_ROWS}, split into smaller batches.` }, { status: 400 });
  }

  const errors: { row: number; error: string }[] = [];
  const validRows: any[] = [];

  rows.forEach((row: any, idx: number) => {
    const { transactionDate, amount, description, authorizationExists } = row;
    if (!transactionDate || amount === undefined || isNaN(Number(amount)) || !description) {
      errors.push({ row: idx + 1, error: "Missing or invalid transactionDate, amount, or description." });
      return;
    }
    const numAmount = Number(amount);
    const authExists = Boolean(authorizationExists);
    validRows.push({
      client_id: user.id,
      kit_phase_id: kitPhaseId,
      transaction_date: transactionDate,
      amount: numAmount,
      description: String(description).trim(),
      authorization_exists: authExists,
      authorization_ref: null,
      flagged: computeFlag(numAmount, authExists),
    });
  });

  if (validRows.length === 0) {
    return NextResponse.json({ error: "No valid rows found.", rowErrors: errors }, { status: 400 });
  }

  const { error } = await supabase.from("client_financial_transactions").insert(validRows);

  if (error) {
    return NextResponse.json({ error: "Import failed.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    imported: validRows.length,
    skipped: errors.length,
    rowErrors: errors,
  });
}
