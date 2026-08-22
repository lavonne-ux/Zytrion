import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header
      className="border-b border-white/10"
      style={{
        background: "linear-gradient(90deg, #0A0F2E 0%, #0B3DBF 45%, #0A0F2E 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-9 h-9">
            <div
              className="absolute inset-0 rounded-full ring-gradient"
              style={{
                background:
                  "conic-gradient(from 0deg, #0A0F2E 0%, #0B3DBF 20%, #1565FF 40%, #4AB3E8 60%, #C7CDD6 75%, #6D28D9 90%, #0A0F2E 100%)",
                WebkitMaskImage:
                  "radial-gradient(closest-side, transparent 62%, black 64%, black 88%, transparent 90%)",
                maskImage:
                  "radial-gradient(closest-side, transparent 62%, black 64%, black 88%, transparent 90%)",
              }}
            />
            <img
              src="/zytrion-orb-logo.png"
              alt="Zytrion Infrastructure Group"
              className="absolute inset-0 w-full h-full object-contain p-1"
            />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">ZYTRION</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/assessment" className="text-zy-chrome hover:text-white transition-colors">
            GRID
          </Link>
          <Link href="/store" className="text-zy-chrome hover:text-white transition-colors">
            Store
          </Link>
          {user ? (
            <>
              <Link href="/portal" className="text-zy-chrome hover:text-white transition-colors">
                Portal
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="text-zy-chrome hover:text-white transition-colors">
              Log In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
