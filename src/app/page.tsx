export default function HomePage() {
  return (
    <main className="flex items-center justify-center min-h-screen text-center">
      <div className="max-w-xl px-6 py-12 rounded-2xl bg-white/10 backdrop-blur">
        <h1 className="text-3xl font-bold mb-4">ScheduleMuse AI</h1>
        <p className="text-white/70 mb-6">
          Welcome! Authentication has been removed from this demo app, so you can use the dashboard without signing in.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/dashboard"
            className="inline-flex justify-center rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-6 py-3 font-semibold text-slate-900 shadow-lg shadow-teal-500/20"
          >
            Go to dashboard
          </a>
          <a
            href="/meeting-setup"
            className="inline-flex justify-center rounded-full border border-white/20 px-6 py-3 font-semibold text-white"
          >
            Booking setup
          </a>
        </div>
      </div>
    </main>
  );
}
