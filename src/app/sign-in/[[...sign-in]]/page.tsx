import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-teal-950/40">
      <div className="w-full max-w-lg py-12 px-6">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <img
            src="/schedulemuseai-logo-1-teal.jpg"
            alt="ScheduleMuseAI logo"
            className="h-16 w-16 rounded-2xl"
          />
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
