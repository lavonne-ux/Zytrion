"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import StatusBanner, { BANNERS } from "@/components/StatusBanner";

// useSearchParams needs a Suspense boundary, so the form lives in an inner
// component and the page itself is the boundary.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  // The auth callback redirects here with ?error=auth when a sign-in link
  // fails, and checkout redirects here with ?enrolled=1 when someone bought
  // a kit while signed out. Neither was read, so both arrived as a blank
  // login form and the person was left guessing.
  const banner =
    searchParams.get("error") === "auth"
      ? BANNERS.auth_error
      : searchParams.get("enrolled") === "1"
      ? BANNERS.enrolled_login
      : null;

  // Where to return after signing in. Only ever a path on this site: a
  // value starting with "//" or carrying a scheme would let someone craft
  // a login link that bounces the person to another domain afterwards,
  // which is how open redirects get used for phishing.
  const rawNext = searchParams.get("next");
  const nextPath =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/portal";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }
  return (
    <main className="min-h-screen bg-zy-near-black text-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        {banner && (
          <StatusBanner tone={banner.tone} title={banner.title} message={banner.message} />
        )}
        <h1 className="text-2xl font-semibold mb-2">Log in</h1>
        <p className="text-zy-chrome mb-8">Access your Zytrion Client Portal.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-8 py-4 rounded-md disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p className="mt-4 text-sm text-zy-chrome text-center">
          <Link href="/forgot-password" className="text-zy-light-blue underline hover:text-white">
            Forgot your password?
          </Link>
        </p>
        <p className="mt-2 text-sm text-zy-chrome text-center">
          Don&apos;t have an account? <Link href="/signup" className="text-zy-light-blue underline hover:text-white">Create one</Link>
        </p>
      </div>
    </main>
  );
}
