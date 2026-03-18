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
      <div className="w-full max-w-4xl rounded-2xl bg-white/10 p-12 backdrop-blur">
        <h1 className="text-5xl font-semibold text-white mb-4">Sign in</h1>
        <p className="text-lg text-white/70 mb-8">Enter any email/password to continue.</p>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-white/80 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-lg text-white focus:border-teal-300 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-white/80 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-lg text-white focus:border-teal-300 focus:outline-none"
              required
            />
          </div>

          {error && <div className="text-base text-rose-200">{error}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            Continue
          </button>
        </form>

        <p className="mt-8 text-base text-white/70">
          Need an account? <a className="font-semibold text-white" href="/sign-up">Sign up</a>
        </p>
      </div>
    </main>
  );
}
