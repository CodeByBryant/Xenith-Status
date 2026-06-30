# Xenith Status

The public status page for Xenith, served at
[status.xenith.life](https://status.xenith.life). A single-page React + Vite app
styled to match the Xenith brand.

## Updating status

Everything is driven by one file: [`src/config/status.ts`](src/config/status.ts).

- **Change a component's health** — edit its `status` field
  (`operational` · `degraded` · `partial` · `major` · `maintenance`).
- **Report an incident** — add an entry to `INCIDENTS`. Append an update to its
  `updates` array as the situation develops; set the final update's `stage` to
  `"resolved"` to close it. The overall banner, uptime bars, and incident
  history all update automatically.
- **Announce planned work** — add an entry to `MAINTENANCE`.

Commit and deploy — there's nothing else to wire up.

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
- Brand fonts: Inter, Playfair Display, Chomsky (the blackletter "X")
