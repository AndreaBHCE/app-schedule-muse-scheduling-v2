export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-4">
          <img src="/schedulemuseai-logo-teal.jpg" alt="ScheduleMuse AI" className="h-10 w-10 rounded-xl" />
          <span className="text-xl font-bold text-white">Schedule Muse AI</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/sign-in"
            className="text-sm font-medium text-white/80 hover:text-white"
          >
            Log In
          </a>
          <a
            href="/sign-up"
            className="rounded-lg bg-teal-500 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-teal-500/30 hover:bg-teal-400"
          >
            Get Started Free
          </a>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">AI-powered scheduling that works for you</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/70">
          Create booking pages, sync calendars, and automate reminders — all without the back-and-forth.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="/sign-up"
            className="rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-8 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-teal-500/30"
          >
            Get Started Free
          </a>
          <a
            href="/sign-in"
            className="rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-white hover:border-white"
          >
            Log In
          </a>
        </div>
      </section>
    </main>
  );
}
