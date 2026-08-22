import Link from "next/link";
import StatStrip from "@/components/StatStrip";
import FounderCount from "@/components/FounderCount";
import FivePillars from "@/components/FivePillars";


export default function Home() {
  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #0A0F2E 0%, #080C1A 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 900px 600px at 50% 60%, rgba(125, 95, 217, 0.45) 0%, rgba(125, 95, 217, 0.15) 45%, transparent 75%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-20 text-center animate-fade-up">
          <div className="flex flex-col items-center gap-3 mb-12">
            <img
              src="/zytrion-orb-logo.png"
              alt="Zytrion Infrastructure Group"
              className="w-16 h-16"
            />
            <div className="text-center">
              <p className="text-lg font-semibold tracking-wide">Zytrion Infrastructure Group</p>
              <p className="text-sm text-zy-chrome">The Momentum of Business</p>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold leading-tight text-white">
            If the bank asked you to prove who is allowed to spend your
            company&apos;s money, could you answer in five seconds?
          </h1>
          <p className="mt-6 text-lg text-zy-chrome leading-relaxed">
            Most founder-led businesses can&apos;t. Not because they&apos;re
            careless, because no one ever showed them what to build. Loan
            denials, mixed personal and business finances, and a business
            that stops the moment you step away all trace back to the same
            missing structure.
          </p>
          <div className="mt-10">
            <Link
              href="/assessment"
              className="inline-block bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-8 py-4 rounded-md"
            >
              Take the Diagnostic
            </Link>
            <p className="mt-3 text-sm text-zy-chrome/70">
              Free during our founding period. Takes about fifteen minutes.
            </p>
            <FounderCount />
          </div>
        </div>
      </section>

      <StatStrip />

      {/* Plain-language explainer */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="border border-white/10 rounded-lg p-8 bg-white/[0.02]">
          <h2 className="text-xl font-semibold text-white mb-4">
            What this actually measures
          </h2>
          <p className="text-zy-chrome leading-relaxed">
            &quot;Governance readiness&quot; sounds like a term for large
            companies with a board and a general counsel. In practice it
            means something much simpler: can your business prove, on
            paper, who is allowed to make decisions, who is responsible
            for what, and where the money is going? Lenders, investors,
            and auditors all check for the same five things. The GRID scores your business against exactly those five,
            and tells you, honestly, which one is the weakest link in
            your structure right now.
          </p>
        </div>
      </section>

      <FivePillars />
    </main>
  );
}
