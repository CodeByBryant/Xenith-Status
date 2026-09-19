// ── Automated monitoring model ───────────────────────────────────────
// Shape of public/monitor-data.json, produced by scripts/check-uptime.mjs
// and consumed by the page at runtime via useMonitorData().

import type { StatusLevel } from "./status";

export interface MonitorDay {
  /** UTC calendar day, YYYY-MM-DD. */
  date: string;
  /** Worst status observed that day. */
  status: StatusLevel;
  /** Number of checks recorded that day. */
  checks: number;
  /** Number of checks counted as downtime (major / partial). */
  down: number;
  /** Availability percentage for the day, 0–100. */
  uptime: number;
}

export interface MonitorComponent {
  /** Status from the most recent check. */
  status: StatusLevel;
  /** Latency of the most recent successful check, in ms (null if down). */
  latencyMs: number | null;
  /** ISO timestamp of the most recent check. */
  lastChecked: string;
  /** Daily history, oldest → newest, up to the configured window. */
  days: MonitorDay[];
}

export interface MonitorData {
  /** ISO timestamp the data file was last written. */
  generatedAt: string;
  /** Keyed by component id (matching src/config/status.ts). */
  components: Record<string, MonitorComponent>;
}

/** Checks run every 15 minutes; data older than this means monitoring is
 * not running, so the page must not claim anything about current health. */
export const MONITOR_STALE_MS = 45 * 60 * 1000;

export function isMonitorDataStale(data: MonitorData, now: number = Date.now()): boolean {
  const generated = new Date(data.generatedAt).getTime();
  return Number.isNaN(generated) || now - generated > MONITOR_STALE_MS;
}
