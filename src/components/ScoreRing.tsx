export default function ScoreRing() {
  return (
    <div className="relative w-[200px] h-[200px] mx-auto">
      <div
        className="absolute inset-0 rounded-full ring-gradient"
        style={{
          background:
            "conic-gradient(from 0deg, #0A0F2E 0%, #0B3DBF 20%, #1565FF 40%, #4AB3E8 60%, #C7CDD6 75%, #6D28D9 90%, #0A0F2E 100%)",
          WebkitMaskImage:
            "radial-gradient(closest-side, transparent 66%, black 68%, black 88%, transparent 90%)",
          maskImage:
            "radial-gradient(closest-side, transparent 66%, black 68%, black 88%, transparent 90%)",
        }}
      />
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
