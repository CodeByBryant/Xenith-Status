// ─────────────────────────────────────────────────────────────────────
//  Xenith Status — automated uptime checker
//
//  Probes every endpoint in src/config/monitors.json, then updates
//  public/monitor-data.json with the current status and a rolling daily
//  uptime history per component. Designed to run on a schedule from
//  .github/workflows/uptime.yml, but you can also run it locally:
//
//      node scripts/check-uptime.mjs
//
//  No dependencies — uses Node 20's built-in fetch + AbortController.
// ─────────────────────────────────────────────────────────────────────

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const MONITORS_PATH = "src/config/monitors.json";
const DATA_PATH = "public/monitor-data.json";
const WINDOW_DAYS = 90;

// Worst-first severity ranking, mirroring src/lib/status.ts.
const RANK = { operational: 0, maintenance: 1, degraded: 2, partial: 3, major: 4 };
const worst = (a, b) => (RANK[a] >= RANK[b] ? a : b);
const isDown = (level) => level === "major" || level === "partial";

const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

async function probeOne(url, mon, cfg) {
  const timeoutMs = cfg.timeoutMs ?? 10000;
  const degradedAfterMs = mon.degradedAfterMs ?? cfg.degradedAfterMs ?? 1500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    // authEnvVar lets a monitor require a bearer secret without ever putting
    // the secret itself in this (public) repo — only the env var *name* is
    // committed; the value lives in this workflow's own repo secrets.
    // mon.headers is for static, non-secret values (e.g. Supabase's public
    // anon key, already shipped in Xenith-Web's client bundle) that are fine
    // to commit directly.
    const headers = {
      "user-agent": "xenith-status-bot/1.0 (+https://status.xenith.life)",
      ...mon.headers,
    };
    if (mon.authEnvVar) {
      const secret = process.env[mon.authEnvVar];
      if (!secret) throw new Error(`Missing env var ${mon.authEnvVar} for monitor "${mon.id}"`);
      headers.authorization = `Bearer ${secret}`;
    }

    const res = await fetch(url, {
      method: mon.method ?? "GET",
      redirect: "follow",
      signal: controller.signal,
      headers,
    });
    const ms = Date.now() - started;
    const code = res.status;
    let ok = mon.anyResponseIsUp
      ? code < 500
      : (mon.healthyStatuses?.includes(code) ?? (code >= 200 && code < 400));

    // A 2xx doesn't prove the page/endpoint actually rendered/behaved
    // correctly — e.g. a broken build can still serve a 200 error page.
    // bodyContains asserts on real content, not just the status code.
    let detail = String(code);
    if (ok && mon.bodyContains) {
      const text = await res.text();
      const hasMarker = text.includes(mon.bodyContains);
      if (!hasMarker) {
        ok = false;
        detail = `${code} (missing "${mon.bodyContains}")`;
      }
    }

    let level;
    if (!ok) level = code >= 500 ? "major" : "degraded";
    else level = ms > degradedAfterMs ? "degraded" : "operational";

    return { level, ms, detail };
  } catch (err) {
    return { level: "major", ms: null, detail: err?.name === "AbortError" ? "timeout" : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

// A monitor with `urls` (rather than a single `url`) probes every entry and
// rolls the results up to one worst-case status — e.g. the "media" monitor
// checking each ambient-sound mp3 under audio.xenith.life so a single dead
// track shows as degraded/major instead of being masked by the others.
async function probe(mon, cfg) {
  const urls = mon.urls ?? [mon.url];
  const results = await Promise.all(urls.map((url) => probeOne(url, mon, cfg)));
  if (urls.length === 1) return results[0];

  const level = results.reduce((acc, r) => worst(acc, r.level), "operational");
  const ms = Math.max(...results.map((r) => r.ms ?? 0)) || null;
  const failing = results
    .map((r, i) => ({ url: urls[i], r }))
    .filter(({ r }) => r.level !== "operational");
  const detail = failing.length
    ? `${failing.length}/${urls.length} failing: ${failing.map(({ url }) => url.split("/").pop()).join(", ")}`
    : `${urls.length}/${urls.length} ok`;

  return { level, ms, detail };
}

// Sentry-based check — for subsystems (AI, notifications) where a synthetic
// HTTP probe would either cost real money every run (calling a real LLM) or
// be intrusive (sending a real push/email every 15 minutes forever). Real
// usage already generates the signal via logger.error()'s "area" tag
// (lib/logger.ts in Xenith-Web) — this just asks Sentry how many distinct
// issues tagged with that area have fired recently, rather than manufacturing
// synthetic traffic.
async function probeSentry(mon) {
  const started = Date.now();
  try {
    const org = process.env.SENTRY_ORG;
    const project = process.env.SENTRY_PROJECT;
    const token = process.env.SENTRY_API_TOKEN;
    if (!org || !project || !token) {
      throw new Error("Missing SENTRY_ORG/SENTRY_PROJECT/SENTRY_API_TOKEN env var");
    }

    const lookback = mon.statsPeriod ?? "15m";
    const query = `${mon.sentryQuery} lastSeen:-${lookback}`;
    // statsPeriod here controls Sentry's own stats window, not our lookback —
    // it only accepts "24h", "14d", or "" (disabled). Our actual time window
    // is scoped via lastSeen in the query string above.
    const url = `https://sentry.io/api/0/projects/${org}/${project}/issues/?query=${encodeURIComponent(query)}&statsPeriod=`;

    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        "user-agent": "xenith-status-bot/1.0 (+https://status.xenith.life)",
      },
    });
    const ms = Date.now() - started;
    if (!res.ok) throw new Error(`Sentry API returned ${res.status}`);

    const issues = await res.json();
    const count = Array.isArray(issues) ? issues.length : 0;
    const degradedAt = mon.degradedAtIssues ?? 1;
    const majorAt = mon.majorAtIssues ?? 3;

    let level = "operational";
    if (count >= majorAt) level = "major";
    else if (count >= degradedAt) level = "degraded";

    return { level, ms, detail: `${count} recent issue${count === 1 ? "" : "s"}` };
  } catch (err) {
    // A Sentry API failure means we couldn't ask, not that the subsystem
    // itself is down — report degraded (visible) rather than major (which
    // would falsely read as a real outage).
    return { level: "degraded", ms: null, detail: `sentry check failed: ${err?.message ?? "unknown"}` };
  }
}

async function main() {
  const cfg = JSON.parse(await readFile(MONITORS_PATH, "utf8"));
  const data = existsSync(DATA_PATH)
    ? JSON.parse(await readFile(DATA_PATH, "utf8"))
    : { generatedAt: "", components: {} };
  if (!data.components) data.components = {};

  const today = utcDay();

  for (const mon of cfg.monitors) {
    const r = mon.kind === "sentry" ? await probeSentry(mon) : await probe(mon, cfg);
    const comp =
      data.components[mon.id] ??
      { status: "operational", latencyMs: null, lastChecked: "", days: [] };

    let day = comp.days.find((d) => d.date === today);
    if (!day) {
      day = { date: today, status: "operational", checks: 0, down: 0, uptime: 100 };
      comp.days.push(day);
    }
    day.checks += 1;
    if (isDown(r.level)) day.down += 1;
    day.status = worst(day.status, r.level);
    day.uptime = Math.round(((day.checks - day.down) / day.checks) * 10000) / 100;

    comp.status = r.level;
    comp.latencyMs = r.ms;
    comp.lastChecked = new Date().toISOString();

    comp.days.sort((a, b) => a.date.localeCompare(b.date));
    if (comp.days.length > WINDOW_DAYS) comp.days = comp.days.slice(-WINDOW_DAYS);

    data.components[mon.id] = comp;
    console.log(`${mon.id.padEnd(14)} ${r.level.padEnd(12)} ${r.ms ?? "—"}ms (${r.detail})`);
  }

  data.generatedAt = new Date().toISOString();
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`Wrote ${DATA_PATH} at ${data.generatedAt}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
