// ── Status domain model & helpers ────────────────────────────────────
// Pure types + derivations. All live data comes from src/config/status.ts.

export type StatusLevel =
  | "operational"
  | "degraded"
  | "partial"
  | "major"
  | "maintenance";

export type IncidentStage =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

export interface ServiceComponent {
  id: string;
  name: string;
  description: string;
  status: StatusLevel;
}

export interface IncidentUpdate {
  /** ISO 8601 timestamp */
  at: string;
  stage: IncidentStage;
  body: string;
}

export interface Incident {
  id: string;
  title: string;
  /** Severity used for the timeline marker color. */
  severity: StatusLevel;
  /** Component ids affected. */
  affected: string[];
  /** Chronological updates, oldest first. */
  updates: IncidentUpdate[];
}

export interface ScheduledMaintenance {
  id: string;
  title: string;
  body: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601 */
  end: string;
  affected: string[];
}

// ── Display metadata ─────────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  /** CSS color var name from the theme. */
  color: string;
  /** Tailwind text class for the color. */
  text: string;
  /** Tailwind background class (solid). */
  bg: string;
}

export const STATUS_META: Record<StatusLevel, StatusMeta> = {
  operational: { label: "Operational",     color: "var(--color-operational)", text: "text-operational",  bg: "bg-operational" },
  degraded:    { label: "Degraded",        color: "var(--color-degraded)",    text: "text-degraded",     bg: "bg-degraded" },
  partial:     { label: "Partial Outage",  color: "var(--color-partial)",     text: "text-partial",      bg: "bg-partial" },
  major:       { label: "Major Outage",    color: "var(--color-major)",       text: "text-major",        bg: "bg-major" },
  maintenance: { label: "Maintenance",     color: "var(--color-maintenance)", text: "text-maintenance",  bg: "bg-maintenance" },
};

export const STAGE_LABEL: Record<IncidentStage, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

// Worst-first ordering so we can pick the most severe state.
const SEVERITY_ORDER: StatusLevel[] = [
  "major",
  "partial",
  "degraded",
  "maintenance",
  "operational",
];

/** The single most severe status across the given components. */
export function overallStatus(components: ServiceComponent[]): StatusLevel {
  for (const level of SEVERITY_ORDER) {
    if (components.some((c) => c.status === level)) return level;
  }
  return "operational";
}

/** Headline shown in the banner for a given overall status. */
export function overallHeadline(level: StatusLevel): string {
  switch (level) {
    case "operational": return "All Systems Operational";
    case "degraded":    return "Degraded Performance";
    case "partial":     return "Partial System Outage";
    case "major":       return "Major System Outage";
    case "maintenance": return "Under Maintenance";
  }
}

/** True once every update on the incident has resolved. */
export function isResolved(incident: Incident): boolean {
  const last = incident.updates[incident.updates.length - 1];
  return last?.stage === "resolved";
}

/** Group incidents by calendar day (local), newest day first. */
export function groupByDay(incidents: Incident[]): [string, Incident[]][] {
  const buckets = new Map<string, Incident[]>();
  for (const inc of incidents) {
    const day = new Date(inc.updates[0]?.at ?? Date.now()).toLocaleDateString(
      undefined,
      { year: "numeric", month: "long", day: "numeric" },
    );
    const list = buckets.get(day) ?? [];
    list.push(inc);
    buckets.set(day, list);
  }
  return [...buckets.entries()].sort(
    (a, b) =>
      new Date(b[1][0].updates[0].at).getTime() -
      new Date(a[1][0].updates[0].at).getTime(),
  );
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
