import { SITE } from "../config/status";

/** Xenith wordmark: blackletter "X" (Chomsky) + "Status" label. */
export function Logo() {
  return (
    <a
      href={SITE.appUrl}
      className="group inline-flex items-center gap-2.5"
      aria-label={`${SITE.name} home`}
    >
      <span className="font-chomsky text-4xl leading-none text-foreground transition-opacity group-hover:opacity-80">
        X
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          {SITE.name}
        </span>
        <span className="text-[0.7rem] uppercase tracking-[0.18em] text-subtle">
          Status
        </span>
      </span>
    </a>
  );
}
