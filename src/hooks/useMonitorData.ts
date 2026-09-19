import { useEffect, useState } from "react";
import { isMonitorDataStale, type MonitorData } from "../lib/monitor";

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

const LAST_GOOD_KEY = "xenith-status:last-good-check";
const REFETCH_MS = 5 * 60 * 1000;

export interface MonitorState {
  /** Fresh, valid data -- null whenever monitoring can't be trusted. */
  data: MonitorData | null;
  /** True until the first fetch settles. */
  loading: boolean;
  /** True when the fetch failed or the data is older than 45 minutes. */
  unavailable: boolean;
  /** ISO time of the last successful check this browser has seen. */
  lastSuccessfulCheck: string | null;
}

function readLastGood(): string | null {
  try {
    return localStorage.getItem(LAST_GOOD_KEY);
  } catch {
    return null;
  }
}

function writeLastGood(iso: string) {
  try {
    localStorage.setItem(LAST_GOOD_KEY, iso);
  } catch {
    /* storage unavailable -- best effort only */
  }
}

/**
 * Fetches the latest automated monitoring data. A failed fetch or stale data
 * is reported as `unavailable`; it is never treated as "operational".
 */
export function useMonitorData(): MonitorState {
  const [state, setState] = useState<MonitorState>({
    data: null,
    loading: true,
    unavailable: false,
    lastSuccessfulCheck: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<MonitorData>) : null))
        .catch(() => null)
        .then((json) => {
          if (cancelled) return;
          const valid = json && json.components && json.generatedAt ? json : null;
          if (valid) writeLastGood(valid.generatedAt);
          const stale = valid ? isMonitorDataStale(valid) : true;
          setState({
            data: valid && !stale ? valid : null,
            loading: false,
            unavailable: !valid || stale,
            lastSuccessfulCheck: valid?.generatedAt ?? readLastGood(),
          });
        });
    };

    load();
    const id = setInterval(load, REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}
