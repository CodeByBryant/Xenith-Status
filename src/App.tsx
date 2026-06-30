import { ComponentList } from "./components/ComponentList";
import { Footer } from "./components/Footer";
import { IncidentHistory } from "./components/IncidentHistory";
import { Logo } from "./components/Logo";
import { OverallBanner } from "./components/OverallBanner";
import { COMPONENTS, INCIDENTS, MAINTENANCE, SITE } from "./config/status";
import { useMonitorData } from "./hooks/useMonitorData";
import { overallStatus } from "./lib/status";

function App() {
  const live = useMonitorData();

  // Live measurements override the manual status for any monitored component;
  // components without a monitor keep the status set in config/status.ts.
  const components = COMPONENTS.map((c) => {
    const measured = live?.components[c.id];
    return measured ? { ...c, status: measured.status } : c;
  });

  const status = overallStatus(components);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8 sm:py-12">
      <header className="mb-8 flex items-center justify-between">
        <Logo />
        <a
          href={SITE.appUrl}
          className="rounded-lg border border-border px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          Open {SITE.name}
        </a>
      </header>

      <main className="flex-1 space-y-10">
        <OverallBanner status={status} updatedAt={live?.generatedAt || __BUILD_TIME__} />

        {MAINTENANCE.length > 0 && (
          <section>
            <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-subtle">
              Scheduled Maintenance
            </h2>
            <div className="space-y-4">
              {MAINTENANCE.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-maintenance/40 bg-card p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-medium text-foreground">{m.title}</h4>
                    <span className="text-xs font-medium text-maintenance">
                      {new Date(m.start).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{m.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <ComponentList components={components} live={live} />
        <IncidentHistory incidents={INCIDENTS} />
      </main>

      <Footer />
    </div>
  );
}

export default App;
