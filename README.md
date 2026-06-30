# Xenith Status

The public status page for Xenith, served at
[status.xenith.life](https://status.xenith.life). A single-page React + Vite app
styled to match the Xenith brand, with **automated uptime monitoring** powered by
a scheduled GitHub Action.

## How it works

Health comes from two sources:

1. **Automated checks** (current status + uptime history) for any component with
   a monitor — no manual updates needed.
2. **Manual entries** in [`src/config/status.ts`](src/config/status.ts) for
   human-narrated incidents, scheduled maintenance, and any component that can't
   be probed automatically.

Live measurements always take precedence; manual status is the fallback.

## Automated monitoring

Endpoints are listed in [`src/config/monitors.json`](src/config/monitors.json) —
each `id` matches a component in `status.ts`:

```json
{ "id": "app", "url": "https://xenith.life" }
```

Every 15 minutes, [`.github/workflows/uptime.yml`](.github/workflows/uptime.yml)
runs [`scripts/check-uptime.mjs`](scripts/check-uptime.mjs), which probes each
URL, classifies it (`operational` / `degraded` / `major`), and writes the result
plus a rolling 90-day daily uptime history to
[`public/monitor-data.json`](public/monitor-data.json). The page fetches that file
at runtime and renders live status and uptime bars. Days before monitoring began
show as "no data" rather than assuming uptime.

Run it locally with `node scripts/check-uptime.mjs`.

**Monitor options:** `method` (default `GET`), `healthyStatuses` (default
200–399), `anyResponseIsUp` (treat any non-5xx as up — handy for auth-gated
endpoints), and `degradedAfterMs` (latency threshold, default 1500).

### Keeping data fresh vs. build limits

By default the page reads `/monitor-data.json` from your own deployment, so each
15-minute data commit triggers a rebuild. That's fine on hosts with generous
build minutes (e.g. Vercel). If your host caps builds (e.g. Cloudflare Pages free
= 500/month), either lower the cron frequency in `uptime.yml`, or set
`VITE_MONITOR_DATA_URL` to the raw GitHub URL (see [`.env.example`](.env.example))
so the page reads live data without redeploying.

## Manual updates

Edit [`src/config/status.ts`](src/config/status.ts):

- **Report an incident** — add an entry to `INCIDENTS`. Append an update to its
  `updates` array as the situation develops; set the final update's `stage` to
  `"resolved"` to close it.
- **Announce planned work** — add an entry to `MAINTENANCE`.
- **Override a component's health** — edit its `status` field. (For monitored
  components, the live check will win once it next runs.)

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Deployment

The build output is a static `dist/` folder — host it anywhere. On Vercel or
Cloudflare Pages, the framework preset (Vite) is detected automatically:

- **Build command:** `npm run build`
- **Output directory:** `dist`

Point the `status.xenith.life` DNS record at the deployment.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Automated uptime checks via GitHub Actions (no third-party service)
- Brand fonts: Inter, Playfair Display, Chomsky (the blackletter "X")

## License

This repository is **source-available but proprietary** — © 2026 Xenith, all
rights reserved. See [LICENSE](LICENSE). Security issues: see [SECURITY.md](SECURITY.md).
