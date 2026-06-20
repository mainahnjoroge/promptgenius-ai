import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand glow">
        <Sparkles className="h-4 w-4 text-white" />
      </span>
      <span className="text-lg">
        Prompt<span className="gradient-text">Genius</span>
      </span>
    </Link>
  );
}
