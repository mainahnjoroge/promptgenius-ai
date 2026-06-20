import Link from "next/link";
import { Logo } from "./logo";
import { AuthButtons } from "./auth-buttons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur">
      <div className="container-px flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/#features" className="hover:text-slate-100">
            Features
          </Link>
          <Link href="/#how" className="hover:text-slate-100">
            How it works
          </Link>
          <Link href="/pricing" className="hover:text-slate-100">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-slate-100">
            Dashboard
          </Link>
        </nav>
        <AuthButtons />
      </div>
    </header>
  );
}
