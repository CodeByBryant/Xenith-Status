import type { CSSProperties } from "react";
import { INCIDENTS, SITE } from "../config/status";
import type { MonitorComponent, MonitorData } from "../lib/monitor";
import {
  STATUS_META,
  type ServiceComponent,
  type StatusLevel,
} from "../lib/status";

const DAY_MS = 86_400_000;

/** A single bar in the uptime strip. "nodata" = no measurement for that day. */
type BarDay = { date: Date; status: StatusLevel | "nodata"; uptime?: number };

/** Local YYYY-MM-DD key for incident bucketing. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** UTC YYYY-MM-DD key, matching the checker's day buckets. */
function utcKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Measured history from automated monitoring. Days without a sample render as
 * "no data" so the page never implies uptime it didn't actually observe.
 */
function measuredHistory(comp: MonitorComponent): { days: BarDay[]; pct: string } {
  const byDate = new Map(comp.days.map((d) => [d.date, d]));
  const days: BarDay[] = [];
  const today = new Date();
  for (let i = SITE.uptimeWindowDays - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS);
    const m = byDate.get(utcKey(date));
    days.push(m ? { date, status: m.status, uptime: m.uptime } : { date, status: "nodata" });
  }

  const checks = comp.days.reduce((s, d) => s + d.checks, 0);
  const down = comp.days.reduce((s, d) => s + d.down, 0);
  const pct = checks > 0 ? (((checks - down) / checks) * 100).toFixed(2) : "—";
  return { days, pct };
}

/**
 * Fallback history derived from manually-logged incidents. Days with no
 * incident are treated as operational.
 */
function incidentHistory(componentId: string): { days: BarDay[]; pct: string } {
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
      if (!prev || rank[inc.severity] > rank[prev]) worst.set(key, inc.severity);
    }
  }

  const days: BarDay[] = [];
  const today = new Date();
  for (let i = SITE.uptimeWindowDays - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS);
    days.push({ date, status: worst.get(dayKey(date)) ?? "operational" });
  }
  const operational = days.filter((d) => d.status === "operational").length;
  const pct = ((operational / days.length) * 100).toFixed(2);
  return { days, pct };
}

function barStyle(status: BarDay["status"]): CSSProperties {
  if (status === "nodata") {
    return { background: "var(--color-border)", opacity: 0.35 };
  }
  return {
    background: STATUS_META[status].color,
    opacity: status === "operational" ? 0.55 : 0.9,
  };
}

function UptimeBar({ days, pct }: { days: BarDay[]; pct: string }) {
  return (
    <div className="mt-3">
      <div className="flex h-8 items-stretch gap-[2px]">
        {days.map((d, i) => (
          <div
            key={i}
            className="group/bar relative flex-1 rounded-[1px] transition-opacity hover:opacity-100"
            style={barStyle(d.status)}
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-elevated px-2 py-1 text-xs text-foreground shadow-lg group-hover/bar:block">
              {d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              {" · "}
              {d.status === "nodata"
                ? "No data"
                : `${STATUS_META[d.status].label}${
                    d.uptime !== undefined && d.uptime < 100 ? ` · ${d.uptime}%` : ""
                  }`}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-subtle">
        <span>{SITE.uptimeWindowDays} days ago</span>
        <span>{pct === "—" ? "Awaiting data" : `${pct}% uptime`}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function ComponentRow({
  component,
  live,
}: {
  component: ServiceComponent;
  live?: MonitorComponent;
}) {
  const meta = STATUS_META[component.status];
  const { days, pct } = live ? measuredHistory(live) : incidentHistory(component.id);

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
          <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
          {meta.label}
        </span>
      </div>
      <UptimeBar days={days} pct={pct} />
    </div>
  );
}

export function ComponentList({
  components,
  live,
}: {
  components: ServiceComponent[];
  live: MonitorData | null;
}) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-subtle">
        Systems
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {components.map((c) => (
          <ComponentRow key={c.id} component={c} live={live?.components[c.id]} />
        ))}
      </div>
    </section>
  );
}
