"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Enter your email address.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      console.error("Password reset request failed:", resetError.message);
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
            If an account exists for {email}, a password reset link is on
            its way. Click it to choose a new password.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zy-near-black text-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Reset your password</h1>
        <p className="text-zy-chrome mb-8">
          Enter the email address on your account and we will send you a
          link to choose a new password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-8 py-4 rounded-md disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="mt-6 text-sm text-zy-chrome text-center">
          <Link href="/login" className="text-zy-light-blue underline hover:text-white">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
