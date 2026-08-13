import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreAssessment, Answers } from "@/lib/assessment/scoring";
import { INSTRUMENT_VERSION } from "@/lib/assessment/statements";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";
import { tierResultNoticeEmail } from "@/lib/email/templates";

interface SubmitBody {
  contactName: string;
  contactBusiness: string;
  contactEmail: string;
  contactPhone?: string;
  answers: Answers;
  referredByPartnerId?: string | null;
}

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.contactName || !body.contactEmail || !body.answers) {
    return NextResponse.json(
      { error: "Name, email, and answers are required." },
      { status: 400 }
    );
  }

  let result;
  try {
    result = scoreAssessment(body.answers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      client_id: null,
      total_score: result.totalScore,
      tier_id: result.tierId,
      instrument_version: INSTRUMENT_VERSION,
      referred_by_partner_id: body.referredByPartnerId ?? null,
      contact_name: body.contactName,
      contact_business: body.contactBusiness ?? null,
      contact_email: body.contactEmail,
      contact_phone: body.contactPhone ?? null,
    })
    .select("id")
    .single();

  if (assessmentError || !assessment) {
    return NextResponse.json(
      { error: "Could not save assessment.", detail: assessmentError?.message },
      { status: 500 }
    );
  }

  const assessmentId = assessment.id;

  const responseRows = Object.entries(body.answers).map(([statementId, value]) => {
    const section = Number(statementId.split(".")[0]);
    return {
      assessment_id: assessmentId,
      statement_id: statementId,
      section,
      value,
    };
  });

  const { error: responsesError } = await supabase.from("responses").insert(responseRows);
  if (responsesError) {
    return NextResponse.json(
      { error: "Assessment saved but responses failed to save.", detail: responsesError.message },
      { status: 500 }
    );
  }

  const pillarScoreRows = result.pillarResults.map((p) => ({
    assessment_id: assessmentId,
    pillar_id: p.pillarId,
    section_total: p.score,
  }));

  const { error: pillarError } = await supabase.from("pillar_scores").insert(pillarScoreRows);
  if (pillarError) {
    return NextResponse.json(
      { error: "Assessment saved but pillar scores failed to save.", detail: pillarError.message },
      { status: 500 }
    );
  }

  // Tier result notice. Fires after everything is durably saved. A
  // failure here must never cost the person their result, the
  // assessment is already recorded, so this is caught and logged, not
  // thrown.
  try {
    const resend = getResendClient();
    if (resend) {
      const { subject, html } = tierResultNoticeEmail({
        contactName: body.contactName,
        businessName: body.contactBusiness || body.contactName,
        totalScore: result.totalScore,
        tierName: result.tierName,
        resultsUrl: `https://www.getzytrion.com/results/${assessmentId}`,
      });
      await resend.emails.send({
        from: EMAIL_FROM,
        to: body.contactEmail,
        subject,
        html,
      });
    }
  } catch (err) {
    console.error("Tier result email failed to send:", err);
  }

  return NextResponse.json({ assessmentId });
}
