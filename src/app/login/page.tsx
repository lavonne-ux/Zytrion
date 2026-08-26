"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
export default function LoginPage() {
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
    router.push("/portal");
    router.refresh();
  }
  return (
    <main className="min-h-screen bg-zy-near-black text-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
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
        <p className="mt-6 text-sm text-zy-chrome text-center">
          Don&apos;t have an account? <Link href="/signup" className="text-zy-light-blue underline hover:text-white">Create one</Link>
        </p>
      </div>
    </main>
  );
}
