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
      <div className="w-full max-w-5xl rounded-3xl bg-white/10 p-14 backdrop-blur">
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500">
            <img src="/schedulemuseai-logo-teal.svg" alt="ScheduleMuse logo" className="h-12 w-12" />
          </div>
          <p className="text-xl font-semibold text-white/70">Schedule Muse</p>
          <h1 className="text-6xl font-semibold text-white leading-tight">Sign in</h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-teal-100 shadow-lg shadow-teal-500/10">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-teal-300"></span>
            Updated UI (v2)
          </div>
        </div>
        <p className="text-xl text-white/70 mb-10">Enter any email/password to continue.</p>

        <form onSubmit={onSubmit} className="space-y-8">
          <div>
            <label className="block text-2xl font-semibold text-white/80 mb-3">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-8 py-5 text-2xl text-white focus:border-teal-300 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-2xl font-semibold text-white/80 mb-3">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-8 py-5 text-2xl text-white focus:border-teal-300 focus:outline-none"
              required
            />
          </div>

          {error && <div className="text-xl text-rose-200">{error}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-10 py-5 text-2xl font-semibold text-slate-900 shadow-lg shadow-teal-500/20 disabled:opacity-50"
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
