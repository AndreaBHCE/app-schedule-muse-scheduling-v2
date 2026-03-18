import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-2xl">
        <SignIn appearance={{
          variables: {
            fontSize: '18px'
          },
          elements: {
            card: {
              width: '100%'
            }
          }
        }} />
      </div>
    </div>
  );
}
