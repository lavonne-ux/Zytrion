import Link from "next/link";


export default function AssessmentIntro() {
  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <p className="text-zy-light-blue text-sm font-medium tracking-wide uppercase mb-3">
          GRID
        </p>
        <h1 className="text-3xl font-semibold mb-6">
          Before you start, here is exactly what happens.
        </h1>

        <div className="space-y-6 text-zy-chrome leading-relaxed">
          <p>
            You&apos;ll answer 40 short statements about how your business
            actually runs today, not how you intend for it to run.
            They&apos;re grouped into five sections: decision authority,
            responsibility, money, documentation, and structural risk.
          </p>
          <p>
            For each one, you&apos;ll choose <span className="text-white">Yes</span>,{" "}
            <span className="text-white">In Progress</span>, or{" "}
            <span className="text-white">No</span>. There&apos;s no wrong
            answer, only an honest one. If you have to think hard about
            whether something is really true, that hesitation is usually
            the answer.
          </p>
          <p>
            When you&apos;re done, you&apos;ll see your score immediately,
            broken down by section, with the single weakest area named
            plainly. That weak spot is where your structure is most
            exposed right now, and where fixing it first will do the most
            good.
          </p>
        </div>

        <div className="mt-10 border border-white/10 rounded-lg p-6 bg-white/[0.02]">
          <p className="text-sm text-zy-chrome">
            Takes about fifteen minutes. Answer based on what you could
            prove today, not what you plan to fix next month.
          </p>
        </div>

        <Link
          href="/assessment/take"
          className="mt-10 inline-block bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-8 py-4 rounded-md"
        >
          Start the Diagnostic
        </Link>
      </div>
    </main>
  );
}
