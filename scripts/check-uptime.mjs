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

async function probe(mon, cfg) {
  const timeoutMs = cfg.timeoutMs ?? 10000;
  const degradedAfterMs = mon.degradedAfterMs ?? cfg.degradedAfterMs ?? 1500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    // authEnvVar lets a monitor require a bearer secret without ever putting
    // the secret itself in this (public) repo — only the env var *name* is
    // committed; the value lives in this workflow's own repo secrets.
    const headers = { "user-agent": "xenith-status-bot/1.0 (+https://status.xenith.life)" };
    if (mon.authEnvVar) {
      const secret = process.env[mon.authEnvVar];
      if (!secret) throw new Error(`Missing env var ${mon.authEnvVar} for monitor "${mon.id}"`);
      headers.authorization = `Bearer ${secret}`;
    }

    const res = await fetch(mon.url, {
      method: mon.method ?? "GET",
      redirect: "follow",
      signal: controller.signal,
      headers,
    });
    const ms = Date.now() - started;
    const code = res.status;
    const ok = mon.anyResponseIsUp
      ? code < 500
      : (mon.healthyStatuses?.includes(code) ?? (code >= 200 && code < 400));

    let level;
    if (!ok) level = code >= 500 ? "major" : "degraded";
    else level = ms > degradedAfterMs ? "degraded" : "operational";

    return { level, ms, detail: String(code) };
  } catch (err) {
    return { level: "major", ms: null, detail: err?.name === "AbortError" ? "timeout" : "unreachable" };
  } finally {
    clearTimeout(timer);
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
    const r = await probe(mon, cfg);
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
