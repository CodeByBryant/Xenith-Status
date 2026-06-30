import { COMPONENTS } from "../config/status";
import {
  formatTime,
  groupByDay,
  isResolved,
  STAGE_LABEL,
  STATUS_META,
  type Incident,
} from "../lib/status";

function componentName(id: string): string {
  return COMPONENTS.find((c) => c.id === id)?.name ?? id;
}

function IncidentCard({ incident }: { incident: Incident }) {
  const meta = STATUS_META[incident.severity];
  const resolved = isResolved(incident);

  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-medium text-foreground">{incident.title}</h4>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            color: resolved ? "var(--color-operational)" : meta.color,
            background: `color-mix(in srgb, ${
              resolved ? "var(--color-operational)" : meta.color
            } 14%, transparent)`,
          }}
        >
          {resolved ? "Resolved" : meta.label}
        </span>
      </div>

      {incident.affected.length > 0 && (
        <p className="mt-1 text-xs text-subtle">
          Affected: {incident.affected.map(componentName).join(", ")}
        </p>
      )}

      <ol className="mt-4 space-y-3">
        {[...incident.updates].reverse().map((u, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{
                background:
                  u.stage === "resolved"
                    ? "var(--color-operational)"
                    : meta.color,
              }}
            />
            <div>
              <p className="text-sm text-foreground">
                <span className="font-medium">{STAGE_LABEL[u.stage]}</span>
                <span className="text-subtle"> · {formatTime(u.at)}</span>
              </p>
              <p className="mt-0.5 text-sm text-muted">{u.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function IncidentHistory({ incidents }: { incidents: Incident[] }) {
  const groups = groupByDay(incidents);

  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-subtle">
        Incident History
      </h2>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted">
          No incidents reported.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([day, dayIncidents]) => (
            <div key={day}>
              <h3 className="mb-3 border-b border-border pb-2 text-sm font-medium text-muted">
                {day}
              </h3>
              <div className="space-y-4">
                {dayIncidents.map((inc) => (
                  <IncidentCard key={inc.id} incident={inc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
