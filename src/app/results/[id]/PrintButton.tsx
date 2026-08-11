"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-lg bg-zy-electric px-5 py-3 text-sm font-semibold text-white hover:bg-zy-royal transition"
    >
      Download / Print Your Results
    </button>
  );
}
