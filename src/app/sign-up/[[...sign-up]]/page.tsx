export default function SignUpPage() {
  return (
    <main className="flex items-center justify-center min-h-screen text-center">
      <div className="max-w-md px-6 py-10 rounded-2xl bg-white/10 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-4">Sign up is disabled</h1>
        <p className="text-white/70 mb-6">This app no longer requires authentication.</p>
        <a
          href="/dashboard"
          className="inline-flex justify-center rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-6 py-3 font-semibold text-slate-900 shadow-lg shadow-teal-500/20"
        >
          Go to dashboard
        </a>
      </div>
    </main>
  );
}
