"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length > 0, [email, password]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please enter both email and password.");
      return;
    }

    // Save user session locally (demo-only)
    localStorage.setItem("scheduleMuseUser", JSON.stringify({ email }));
    router.push("/dashboard");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-teal-950/40">
      <div className="w-full max-w-md rounded-2xl bg-white/10 p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white mb-2">Sign in</h1>
        <p className="text-white/70 mb-6">Enter any email/password to continue.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-teal-300 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-teal-300 focus:outline-none"
              required
            />
          </div>

          {error && <div className="text-sm text-rose-200">{error}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            Continue
          </button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          Need an account? <a className="font-semibold text-white" href="/sign-up">Sign up</a>
        </p>
      </div>
    </main>
  );
}
