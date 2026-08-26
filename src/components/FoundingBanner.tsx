// src/components/FoundingBanner.tsx
// Persistent thin bar above the hero. No longer tied to live stat data,
// a slow-refreshing or stale count sitting in front of every visitor was
// a real risk on its own. This is a static call to action instead,
// nothing in it can ever go stale, and it drives straight to the
// diagnostic instead of just reporting a number.
import Link from "next/link";

export default function FoundingBanner() {
  return (
    <Link
      href="/assessment"
      className="block w-full border-b border-zy-light-blue/20 bg-zy-near-black hover:bg-white/[0.02] transition-colors"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-2 text-center">
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full bg-zy-light-blue animate-pulse"
          aria-hidden="true"
        />
        <p className="text-sm text-zy-chrome">
          <span className="font-semibold text-zy-light-blue animate-pulse">
            Free GRID Diagnostic
          </span>{" "}
          during our founding period. Takes about fifteen minutes.
        </p>
      </div>
    </Link>
  );
}
