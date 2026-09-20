"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // The reset link is exchanged for a session server-side at
    // /auth/callback before the visitor ever reaches this page, so a
    // live session normally already exists by the time this component
    // mounts. Check for it directly rather than waiting on a client-side
    // auth event that, under that flow, never fires.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
      setChecking(false);
    });

    // Kept as a fallback for links that land here carrying the recovery
    // token directly (older email templates, or a session established
    // after this listener attaches).
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
        setChecking(false);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zy-near-black text-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Choose a new password</h1>
        <p className="text-zy-chrome mb-8">Enter a new password for your account.</p>
        {checking && (
          <p className="text-sm text-zy-chrome mb-4">Verifying your reset link...</p>
        )}
        {!checking && !ready && (
          <p className="text-sm text-red-400 mb-4">
            This reset link has expired or was already used. Request a new
            one from the{" "}
            <a href="/forgot-password" className="underline hover:text-white">
              forgot password
            </a>{" "}
            page.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-white placeholder:text-zy-chrome/50 outline-none focus:border-zy-electric"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !ready}
            className="w-full bg-zy-electric hover:bg-zy-royal transition-colors text-white font-medium px-8 py-4 rounded-md disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
