// Template for a resolved incident. Deliberately outside the production
// import path (nothing imports this file): copy the object into INCIDENTS in
// ../status.ts when you need one, so example data can never ship to the page.
import type { Incident } from "../../lib/status";

export const EXAMPLE_INCIDENT: Incident =
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
  };
