import { Link } from "@tanstack/react-router";
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-sm font-bold tracking-tight sm:text-base">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-lg text-primary-foreground">♞</span>
          Мой дебютный репертуар
        </Link>
      </div>
    </header>
  );
}