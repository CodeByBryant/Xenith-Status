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
];

// ── Active / past incidents (newest activity is sorted automatically) ─
export const INCIDENTS: Incident[] = [
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
