import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { authEnabled } from "@/lib/flags";

export default function SignInPage() {
  if (!authEnabled) redirect("/dashboard");
  return (
    <div className="grid min-h-screen place-items-center grid-bg p-6">
      <SignIn />
    </div>
  );
}
