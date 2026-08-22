const PILLARS = [
  {
    number: "01",
    name: "Authority Clarity",
    description: "Who is allowed to decide, documented and easy to produce.",
  },
  {
    number: "02",
    name: "Money Containment",
    description: "Where the money goes, and who is allowed to move it.",
  },
  {
    number: "03",
    name: "Responsibility Ownership",
    description: "Who owns each task, without anyone guessing.",
  },
  {
    number: "04",
    name: "Evidence Integrity",
    description: "Proof that holds up the moment someone asks for it.",
  },
  {
    number: "05",
    name: "Governance Discipline",
    description: "The habits that keep the other four running.",
  },
];

export default function FivePillars() {
  return (
    <section className="max-w-5xl mx-auto px-6 pb-24">
      <h2 className="text-xl font-semibold text-white text-center mb-2">
        The Five Pillars
      </h2>
      <p className="text-zy-chrome text-center mb-12 max-w-xl mx-auto">
        Every GRID score breaks down into these five, the same five
        lenders, investors, and auditors check.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {PILLARS.map((pillar) => (
          <div key={pillar.number} className="text-center">
            <div className="mb-3 flex justify-center">
              <span className="text-2xl font-bold text-zy-electric">
                {pillar.number}
              </span>
            </div>
            <div className="h-px w-8 bg-zy-silver/30 mx-auto mb-4" />
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
