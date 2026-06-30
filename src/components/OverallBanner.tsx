import {
  overallHeadline,
  STATUS_META,
  type StatusLevel,
} from "../lib/status";

interface Props {
  status: StatusLevel;
  /** ISO timestamp of the last data update. */
  updatedAt: string;
}

/** The large hero banner: overall system status + last-updated time. */
export function OverallBanner({ status, updatedAt }: Props) {
  const meta = STATUS_META[status];
  const ok = status === "operational";

  return (
    <section
      className="relative overflow-hidden rounded-xl border p-6 sm:p-8"
      style={{
        borderColor: meta.color,
        background: `color-mix(in srgb, ${meta.color} 8%, var(--color-card))`,
      }}
    >
      <div className="flex items-center gap-4">
        <span className="relative flex h-3.5 w-3.5 shrink-0">
          {ok && (
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: meta.color }}
            />
          )}
          <span
            className="relative inline-flex h-3.5 w-3.5 rounded-full"
            style={{ background: meta.color }}
          />
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {overallHeadline(status)}
        </h1>
      </div>
      <p className="mt-2 pl-[1.875rem] text-sm text-muted">
        Last updated{" "}
        {new Date(updatedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </section>
  );
}
