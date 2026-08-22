import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="bg-zy-near-black border-b border-white/10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-wide text-white">
          ZYTRION
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
