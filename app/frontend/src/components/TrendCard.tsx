import type { GanttProject, TrendMonth } from "@/lib/types";

const PLOT_H = 220;

export function TrendCard({
  trend,
  projects,
  value,
  onChange,
}: {
  trend: TrendMonth[];
  projects: GanttProject[];
  value: string;
  onChange: (id: string) => void;
}) {
  const cols = trend.length;
  const points = trend
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.pct !== null)
    .map(({ m, i }) => ({ x: i + 0.5, y: PLOT_H * (1 - (m.pct ?? 0) / 100), pct: m.pct as number, m }));
  const summary = points.map((p) => `${p.m.label} ${p.pct} %`).join(", ");

  return (
    <section className="card" aria-label="Évolution mois par mois">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Évolution mois par mois</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">Jalons atteints, en % des jalons prévus chaque mois</p>
        </div>
        <label className="sr-only" htmlFor="trend-project">
          Projet
        </label>
        <select id="trend-project" className="field !py-1.5" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Tous les projets</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-11 flex gap-2.5">
        <div className="flex h-[220px] w-10 flex-col justify-between text-right text-[11.5px] text-muted" aria-hidden="true">
          <span>100 %</span>
          <span>50 %</span>
          <span>0 %</span>
        </div>

        <div className="relative flex-1">
          <div className="grid h-[220px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {trend.map((m) => (
              <div key={m.month} className="flex items-end justify-center">
                {m.state === "future" ? (
                  <div
                    className="h-[220px] w-[58px] rounded-full border border-[#e3e8e5]"
                    style={{ background: "repeating-linear-gradient(135deg,#fff,#fff 4px,#e3e8e5 4px,#e3e8e5 5.5px)" }}
                    title={`${m.label} : à venir (${m.total} jalon${m.total > 1 ? "s" : ""} prévu${m.total > 1 ? "s" : ""})`}
                  />
                ) : (
                  <div
                    className="flex h-[220px] w-[58px] items-end overflow-hidden rounded-full bg-[#eef1f0]"
                    title={m.total ? `${m.label} : ${m.achieved}/${m.total} jalons atteints` : `${m.label} : aucun jalon prévu`}
                  >
                    <div
                      className="w-full rounded-full"
                      style={{
                        height: `${m.pct ?? 0}%`,
                        background: m.state === "current" ? "#7cc19b" : "var(--accent-2)",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {points.length > 1 && (
            <svg
              viewBox={`0 0 ${cols * 100} ${PLOT_H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`Courbe de l’achèvement des jalons : ${summary}`}
              className="pointer-events-none absolute left-0 top-0 h-[220px] w-full overflow-visible"
            >
              <polyline
                points={points.map((p) => `${p.x * 100},${p.y}`).join(" ")}
                fill="none"
                stroke="var(--ink)"
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {points.map((p) => (
            <div key={p.m.month} className="pointer-events-none absolute" style={{ left: `${(p.x / cols) * 100}%`, top: p.y }}>
              <span className="absolute -left-[6.5px] -top-[6.5px] h-[13px] w-[13px] rounded-full border-[2.5px] border-ink bg-white" />
              <span
                className="absolute -translate-x-1/2 whitespace-nowrap rounded-[7px] bg-ink px-2 py-[3px] text-xs font-medium text-white"
                style={{ top: p.pct >= 90 ? -34 : -30 }}
              >
                {p.pct} %
              </span>
            </div>
          ))}

          <div className="mt-3 grid text-center text-[12.5px] text-muted" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {trend.map((m) => (
              <span key={m.month} className={m.state === "current" ? "font-semibold text-ink" : ""}>
                {m.label}
                {m.state === "current" ? " · en cours" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
