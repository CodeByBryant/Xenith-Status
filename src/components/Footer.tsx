import { SITE } from "../config/status";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border pt-6 text-sm text-subtle">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {SITE.name}
        </p>
        <nav className="flex items-center gap-5">
          <a href={SITE.appUrl} className="transition-colors hover:text-foreground">
            Home
          </a>
          <a
            href="https://docs.xenith.life"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </a>
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="transition-colors hover:text-foreground"
          >
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
