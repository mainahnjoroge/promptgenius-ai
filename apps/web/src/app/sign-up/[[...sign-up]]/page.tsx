import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { authEnabled } from "@/lib/flags";

export default function SignUpPage() {
  if (!authEnabled) redirect("/dashboard");
  return (
    <div className="grid min-h-screen place-items-center grid-bg p-6">
      <SignUp />
    </div>
  );
}
