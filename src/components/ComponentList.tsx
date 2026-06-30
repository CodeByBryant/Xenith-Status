import { INCIDENTS, SITE } from "../config/status";
import {
  STATUS_META,
  type ServiceComponent,
  type StatusLevel,
} from "../lib/status";

const DAY_MS = 86_400_000;

/** Local YYYY-MM-DD key for bucketing by calendar day. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Build a per-day status history for one component over the uptime window,
 * derived from incidents that affected it. Days with no incident are
 * operational. Returns oldest→newest.
 */
function buildHistory(componentId: string): { date: Date; status: StatusLevel }[] {
  // Map of day → worst severity seen that day for this component.
  const worst = new Map<string, StatusLevel>();
  const rank: Record<StatusLevel, number> = {
    operational: 0,
    maintenance: 1,
    degraded: 2,
    partial: 3,
    major: 4,
  };

  for (const inc of INCIDENTS) {
    if (!inc.affected.includes(componentId)) continue;
    for (const u of inc.updates) {
      const key = dayKey(new Date(u.at));
      const prev = worst.get(key);
      if (!prev || rank[inc.severity] > rank[prev]) {
        worst.set(key, inc.severity);
      }
    }
  }

  const days: { date: Date; status: StatusLevel }[] = [];
  const today = new Date();
  for (let i = SITE.uptimeWindowDays - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS);
    days.push({ date, status: worst.get(dayKey(date)) ?? "operational" });
  }
  return days;
}

function UptimeBar({ componentId }: { componentId: string }) {
  const history = buildHistory(componentId);
  const operational = history.filter((d) => d.status === "operational").length;
  const pct = ((operational / history.length) * 100).toFixed(2);

  return (
    <div className="mt-3">
      <div className="flex h-8 items-stretch gap-[2px]">
        {history.map((d, i) => (
          <div
            key={i}
            className="group/bar relative flex-1 rounded-[1px] transition-opacity hover:opacity-100"
            style={{
              background: STATUS_META[d.status].color,
              opacity: d.status === "operational" ? 0.55 : 0.9,
            }}
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-elevated px-2 py-1 text-xs text-foreground shadow-lg group-hover/bar:block">
              {d.date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}{" "}
              · {STATUS_META[d.status].label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-subtle">
        <span>{SITE.uptimeWindowDays} days ago</span>
        <span>{pct}% uptime</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function ComponentRow({ component }: { component: ServiceComponent }) {
  const meta = STATUS_META[component.status];
  return (
    <div className="border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-foreground">{component.name}</h3>
          <p className="mt-0.5 text-sm text-muted">{component.description}</p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-2 text-sm font-medium"
          style={{ color: meta.color }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: meta.color }}
          />
          {meta.label}
        </span>
      </div>
      <UptimeBar componentId={component.id} />
    </div>
  );
}

export function ComponentList({
  components,
}: {
  components: ServiceComponent[];
}) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-subtle">
        Systems
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {components.map((c) => (
          <ComponentRow key={c.id} component={c} />
        ))}
      </div>
    </section>
  );
}
