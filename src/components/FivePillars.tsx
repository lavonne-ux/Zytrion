const PILLARS = [
  {
    name: "Authority Clarity",
    description: "Who is allowed to decide, documented and easy to produce.",
  },
  {
    name: "Money Containment",
    description: "Where the money goes, and who is allowed to move it.",
  },
  {
    name: "Responsibility Ownership",
    description: "Who owns each task, without anyone guessing.",
  },
  {
    name: "Evidence Integrity",
    description: "Proof that holds up the moment someone asks for it.",
  },
  {
    name: "Governance Discipline",
    description: "The habits that keep the other four running.",
  },
];

export default function FivePillars() {
  return (
    <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 border-t border-white/5">
      <p className="gradient-text text-sm font-bold tracking-wide uppercase text-center mb-3">
        The Score, Broken Down
      </p>
      <h2 className="text-xl font-semibold text-white text-center mb-2">
        The Five Pillars
      </h2>
      <p className="text-zy-chrome text-center mb-10 max-w-xl mx-auto">
        Every GRID score is these five, in equal share, the same five
        lenders, investors, and auditors check.
      </p>

      <div
        className="relative h-2 rounded-full overflow-hidden mb-12 pillar-bar-flow"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #0A0F2E, #0B3DBF, #1565FF, #4AB3E8, #C7CDD6, #6D28D9, #0A0F2E)",
        }}
      >
        {[20, 40, 60, 80].map((pct) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 w-px bg-zy-near-black/50 z-10"
            style={{ left: `${pct}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.name}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5"
          >
            <h3 className="text-white font-semibold mb-2">{pillar.name}</h3>
            <p className="text-sm text-zy-chrome leading-relaxed">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

