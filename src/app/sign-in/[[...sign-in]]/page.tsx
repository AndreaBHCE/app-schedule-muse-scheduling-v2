import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <SignIn appearance={{
        variables: {
          fontSize: '18px'
        },
        elements: {
          card: {
            width: '100%',
            maxWidth: '56rem',
            margin: '0 auto'
          }
        }
      }} />
    </div>
  );
}
