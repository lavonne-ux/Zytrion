"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!contactName || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { contact_name: contactName, business_name: businessName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // With email confirmation off, Supabase returns a real session
    // immediately, no email is ever sent, nothing to wait for. Only
    // fall back to the "check your email" screen when a session
    // genuinely wasn't returned, meaning confirmation is actually
    // required right now.
    if (data.session) {
      router.push("/portal");
      router.refresh();
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <main className="min-h-screen bg-zy-near-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-4">Check your email</h1>
          <p className="text-zy-chrome leading-relaxed">
            We sent a confirmation link to {email}. Click it to activate
            your account, then come back and log in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zy-near-black text-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-zy-chrome mb-8">
          For clients enrolled in a Zytrion Implementation Kit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
          />
          <input
            type="text"
            placeholder="Business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
          />
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
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-8 py-4 rounded-md disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zy-chrome text-center">
          Already have an account? <Link href="/login" className="text-zy-light-blue underline hover:text-white">Log in</Link>
        </p>
      </div>
    </main>
  );
}
