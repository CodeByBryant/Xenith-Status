import { useEffect, useState } from "react";
import type { MonitorData } from "../lib/monitor";

/**
 * Where to read the generated uptime data from. Defaults to the file served
 * alongside the site. To decouple data refreshes from site rebuilds (e.g. on
 * hosts with tight build limits), point this at the raw GitHub URL instead:
 *
 *   VITE_MONITOR_DATA_URL=https://raw.githubusercontent.com/CodeByBryant/Xenith-Status/main/public/monitor-data.json
 */
const DATA_URL =
  (import.meta.env.VITE_MONITOR_DATA_URL as string | undefined) ??
  "/monitor-data.json";

/** Fetches the latest automated monitoring data, or null if unavailable. */
export function useMonitorData(): MonitorData | null {
  const [data, setData] = useState<MonitorData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<MonitorData>) : null))
      .then((json) => {
        if (!cancelled && json && json.components) setData(json);
      })
      .catch(() => {
        /* Offline or not yet generated — page falls back to manual config. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
