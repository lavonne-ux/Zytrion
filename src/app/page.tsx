import Link from "next/link";
import StatStrip from "@/components/StatStrip";


export default function Home() {
  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-20 text-center">
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
    </main>
  );
}
