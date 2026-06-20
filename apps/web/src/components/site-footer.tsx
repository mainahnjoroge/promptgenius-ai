import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-12">
      <div className="container-px flex flex-col items-center justify-between gap-6 text-sm text-muted md:flex-row">
        <Logo />
        <p>Generate. Bundle. Monetize. — Built for the prompt economy.</p>
        <p>© {new Date().getFullYear()} PromptGenius AI</p>
      </div>
    </footer>
  );
}
