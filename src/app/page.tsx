import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <img
            src="/schedulemuseai-logo-teal.jpg"
            alt="ScheduleMuse AI"
            className="w-36 h-36 mx-auto rounded-xl"
          />
          <h1 className="text-4xl font-bold text-white">ScheduleMuse AI</h1>
          <p className="text-xl text-slate-300 max-w-md mx-auto">
            AI-powered scheduling platform for musicians and creators
          </p>
        </div>
        <div className="space-y-4">
          <a
            href="/sign-in"
            className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Sign In
          </a>
          <div>
            <a
              href="/sign-up"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
