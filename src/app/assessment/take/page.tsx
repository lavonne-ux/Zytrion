"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SECTIONS, statementsForSection, Section } from "@/lib/assessment/statements";
import { AnswerValue, Answers } from "@/lib/assessment/scoring";

const TOTAL_STEPS = SECTIONS.length + 1; // 5 sections + contact step

const OPTIONS: { label: string; value: AnswerValue }[] = [
  { label: "Yes", value: 2 },
  { label: "In Progress", value: 1 },
  { label: "No", value: 0 },
];

export default function TakeAssessment() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0-4 = sections, 5 = contact
  const [answers, setAnswers] = useState<Answers>({});
  const [contactName, setContactName] = useState("");
  const [contactBusiness, setContactBusiness] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const isContactStep = step === SECTIONS.length;
  const currentSection: Section | null = isContactStep ? null : SECTIONS[step];
  const currentStatements = currentSection ? statementsForSection(currentSection) : [];

  const sectionComplete = currentStatements.every((s) => answers[s.id] !== undefined);

  function setAnswer(statementId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [statementId]: value }));
  }

  function goNext() {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit() {
    setError(null);
    if (!contactName || !contactEmail) {
      setError("Name and email are required to see your results.");
      return;
    }
    if (!termsAccepted) {
      setError("Please agree to the Terms of Use to see your results.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          contactBusiness,
          contactEmail,
          contactPhone,
          answers,
          termsAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.detail
            ? `${data.error} DETAIL: ${data.detail}`
            : data.error ?? "Something went wrong. Please try again."
        );
        setSubmitting(false);
        return;
      }
      router.push(`/results/${data.assessmentId}`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-14">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-zy-electric" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {!isContactStep && currentSection && (
          <>
            <p className="text-zy-light-blue text-sm font-medium tracking-wide uppercase mb-2">
              Section {currentSection} of 5
            </p>
            <h1 className="text-2xl font-semibold mb-8">
              {currentStatements[0].sectionTitle}
            </h1>

            <div className="space-y-8">
              {currentStatements.map((s) => (
                <div key={s.id} className="border-b border-white/10 pb-8">
                  <p className="text-white font-medium mb-2">{s.text}</p>
                  <p className="text-sm text-zy-chrome/80 mb-4">{s.evidence}</p>
                  <div className="flex gap-3">
                    {OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setAnswer(s.id, opt.value)}
                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                          answers[s.id] === opt.value
                            ? "bg-zy-electric border-zy-electric text-white"
                            : "border-white/20 text-zy-chrome hover:border-white/40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="px-6 py-3 rounded-md text-zy-chrome disabled:opacity-30"
              >
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!sectionComplete}
                className="px-8 py-3 rounded-md bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {step === SECTIONS.length - 1 ? "See My Results" : "Next Section"}
              </button>
            </div>
          </>
        )}

        {isContactStep && (
          <>
            <p className="text-zy-light-blue text-sm font-medium tracking-wide uppercase mb-2">
              Almost done
            </p>
            <h1 className="text-2xl font-semibold mb-3">
              Where should we send your score?
            </h1>
            <p className="text-zy-chrome mb-8">
              Your Diagnostic is scored and ready. Enter your details to
              unlock your results.
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
              />
              <input
                type="text"
                placeholder="Business name"
                value={contactBusiness}
                onChange={(e) => setContactBusiness(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
              />
              <input
                type="email"
                placeholder="Email address"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
              />
            </div>

            <label className="mt-6 flex items-start gap-3 text-sm text-zy-chrome cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-zy-electric shrink-0"
              />
              <span>
                I have read and agree to Zytrion&apos;s{" "}
                
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zy-light-blue underline hover:text-white"
                >
                  Terms of Use
                </a>
                , including the GRID Restricted Use and Confidentiality section.
              </span>
            </label>

            {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

            <div className="mt-10 flex justify-between">
              <button
                type="button"
                onClick={goBack}
                className="px-6 py-3 rounded-md text-zy-chrome"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 rounded-md bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium disabled:opacity-50"
              >
                {submitting ? "Scoring..." : "See My Results"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
