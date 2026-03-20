import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-teal-950/40">
      <div className="w-full max-w-lg py-12 px-6">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500">
            <img
              src="/schedulemuseai-logo-transparent-01.png"
              alt="ScheduleMuse logo"
              className="h-10 w-10"
            />
          </div>
          <p className="text-3xl font-semibold text-white/90">ScheduleMuseAI</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-white/10 backdrop-blur border border-white/20 shadow-xl",
            },
          }}
        />
      </div>
    </main>
  );
}
