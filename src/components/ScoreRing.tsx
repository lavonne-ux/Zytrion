const ARCS = [
  { color: "#0B3DBF", rotate: -90 },
  { color: "#1565FF", rotate: -18 },
  { color: "#4AB3E8", rotate: 54 },
  { color: "#C7CDD6", rotate: 126 },
  { color: "#0B3DBF", rotate: 198 },
];

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = 94;

export default function ScoreRing() {
  return (
    <div className="relative w-[200px] h-[200px] mx-auto">
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        {ARCS.map((arc, i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
            strokeDashoffset={ARC_LENGTH}
            transform={`rotate(${arc.rotate} 100 100)`}
            className="ring-arc"
            style={{ animationDelay: `${0.25 + i * 0.15}s` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/zytrion-orb-logo.png"
          alt="Zytrion Infrastructure Group"
          className="w-16 h-16"
        />
      </div>
    </div>
  );
}
