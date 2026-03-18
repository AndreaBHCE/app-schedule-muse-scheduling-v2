import { redirect } from "next/navigation";

export default function SignInPage() {
  // Use Clerk's hosted sign-in page so the UI matches the sign-up experience.
  redirect("https://app.schedulemuseai.com/sign-in");
}
