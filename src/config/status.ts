// ─────────────────────────────────────────────────────────────────────
//  Xenith Status — single source of truth
//
//  Edit THIS file to update the status page, then commit & deploy.
//  Nothing else needs to change.
//
//  • Flip a component's `status` to reflect current health.
//  • Add an entry to INCIDENTS when something breaks; append updates as
//    you learn more. Set the final update's stage to "resolved" to close it.
//  • Add to MAINTENANCE for planned work.
// ─────────────────────────────────────────────────────────────────────

import type {
  Incident,
  ScheduledMaintenance,
  ServiceComponent,
} from "../lib/status";

export const SITE = {
  name: "Xenith",
  appUrl: "https://xenith.life",
  statusUrl: "https://status.xenith.life",
  supportEmail: "support@xenith.life",
  /** Days of history shown in each component's uptime bar. */
  uptimeWindowDays: 90,
} as const;

// ── Components (services we report on) ───────────────────────────────
export const COMPONENTS: ServiceComponent[] = [
  {
    id: "app",
    name: "Web App",
    description: "The Xenith web application and dashboard.",
    status: "operational",
  },
  {
    id: "auth",
    name: "Authentication",
    description: "Sign-in, sessions, and Google / Microsoft OAuth.",
    status: "operational",
  },
  {
    id: "database",
    name: "Database & Storage",
    description: "Your data, profiles, and synced entries (Supabase).",
    status: "operational",
  },
  {
    id: "ai",
    name: "AI Features",
    description: "Growth paths, insights, and assistive AI.",
    status: "operational",
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Push notifications and transactional email.",
    status: "operational",
  },
  {
    id: "media",
    name: "Focus Audio",
    description: "Ambient sound delivery for the Focus timer.",
    status: "operational",
  },
  {
    id: "api",
    name: "Public API",
    description: "The public API (api/v1) used by integrations and API keys.",
    status: "operational",
  },
  {
    id: "billing",
    name: "Billing",
    description: "Stripe checkout and subscription management.",
    status: "operational",
  },
];

// ── Active / past incidents (newest activity is sorted automatically) ─
export const INCIDENTS: Incident[] = [
  {
    id: "2026-07-14-api-waf-block",
    title: "Public API blocked for non-browser clients",
    severity: "major",
    affected: ["api"],
    updates: [
      {
        at: "2026-07-14T02:00:00Z",
        stage: "investigating",
        body: "We're investigating reports that api.xenith.life/api/v1 endpoints, including the health check, are unreachable.",
      },
      {
        at: "2026-07-14T02:20:00Z",
        stage: "identified",
        body: "Identified the cause: an edge firewall rule intended to block scanner traffic was blocking any request with a curl/wget/python User-Agent — which is also the normal signature of legitimate API clients (scripts, integrations, our own health check) — across the entire site.",
      },
      {
        at: "2026-07-14T02:35:00Z",
        stage: "monitoring",
        body: "Scoped the rule to exempt /api/v1/* while keeping it in place elsewhere. Separately found that our own health check's self-test was being blocked for a different reason (our server's outbound requests were flagged by bot-detection independent of the fix above) and moved that check in-process so it no longer depends on the edge at all. Monitoring after re-enabling full edge protection on all subdomains.",
      },
      {
        at: "2026-07-14T03:05:00Z",
        stage: "resolved",
        body: "Verified working end-to-end: the public API is reachable for real clients (including curl/scripts) at /api/v1/*, the health check passes, and every subdomain has normal edge protection restored. No user data was affected.",
      },
    ],
  },
  // Example of a resolved incident — delete or keep as a template.
  {
    id: "2026-06-21-auth-latency",
    title: "Elevated sign-in latency",
    severity: "degraded",
    affected: ["auth"],
    updates: [
      {
        at: "2026-06-21T14:02:00Z",
        stage: "investigating",
        body: "We're investigating reports of slow sign-ins for some users.",
      },
      {
        at: "2026-06-21T14:28:00Z",
        stage: "identified",
        body: "Identified elevated latency from our auth provider's edge region.",
      },
      {
        at: "2026-06-21T15:10:00Z",
        stage: "monitoring",
        body: "A fix has been applied and sign-in times have returned to normal. Monitoring.",
      },
      {
        at: "2026-06-21T15:55:00Z",
        stage: "resolved",
        body: "Sign-in latency is fully recovered. Thanks for your patience.",
      },
    ],
  },
];

// ── Scheduled maintenance ────────────────────────────────────────────
export const MAINTENANCE: ScheduledMaintenance[] = [];
