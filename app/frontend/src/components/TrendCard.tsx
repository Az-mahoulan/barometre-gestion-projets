import type { GanttProject, TrendMonth } from "@/lib/types";

import { Icon } from "./ui";

const PLOT_H = 180;

// Couleur d'une barre selon le taux de jalons atteints dans le mois.
function barColor(pct: number): string {
  if (pct >= 100) return "#1f7a4d"; // vert : objectif atteint
  if (pct >= 95) return "#6fbf8f"; // vert moins franc
  if (pct >= 50) return "#e8901c"; // orange
  if (pct >= 25) return "#e2582c"; // orange tirant sur le rouge
  return "#c7321f"; // rouge
}

// Couleur d'un segment de courbe : montant en vert, descendant en rouge, stable en gris.
function trendColor(from: number, to: number): string {
  if (to > from) return "#1f7a4d";
  if (to < from) return "#c7321f";
  return "#9aa3ae";
}

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
  // Écart entre les deux derniers mois mesurés.
  const last = points.at(-1);
  const prev = points.at(-2);
  const delta = last && prev ? last.pct - prev.pct : null;

  return (
    <section className="card" aria-label="Évolution mois par mois">
      <div className="flex items-center justify-between gap-3">
        <h2 className="whitespace-nowrap text-[15px] font-bold">Évolution mois par mois</h2>
        <label className="sr-only" htmlFor="trend-project">
          Projet
        </label>
        <select id="trend-project" className="field min-w-0 max-w-[150px] !py-1.5" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Tous les projets</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-0.5 text-[12px] text-muted">Jalons atteints, en % des jalons prévus chaque mois</p>
      {delta !== null && prev && (
            <p className="mt-2.5 flex items-center gap-2 whitespace-nowrap text-[12px] text-muted">
              <span
                className={`grid h-[26px] w-[26px] place-items-center rounded-[8px] ${
                  delta > 0 ? "bg-ok-soft text-ok" : delta < 0 ? "bg-late-soft text-late" : "bg-surface-2 text-ink-2"
                }`}
              >
                <Icon name={delta > 0 ? "rise" : delta < 0 ? "down" : "flat"} className="h-4 w-4" />
              </span>
              <b className={delta > 0 ? "text-ok" : delta < 0 ? "text-late" : "text-ink-2"}>
                {delta > 0 ? "+" : delta < 0 ? "−" : ""}
                {Math.abs(delta)} pts
              </b>
              par rapport à {prev.m.label}
            </p>
          )}

      <div className="mt-9 flex gap-2.5">
        <div className="flex h-[180px] w-10 flex-col justify-between text-right text-[11px] text-muted" aria-hidden="true">
          <span>100 %</span>
          <span>50 %</span>
          <span>0 %</span>
        </div>

        <div className="relative flex-1">
          <div className="grid h-[180px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {trend.map((m) => (
              <div key={m.month} className="flex items-end justify-center">
                {m.state === "future" ? (
                  <div
                    className="h-[180px] w-[60%] max-w-[56px] rounded-[18px] bg-track"
                    title={`${m.label} : à venir (${m.total} jalon${m.total > 1 ? "s" : ""} prévu${m.total > 1 ? "s" : ""})`}
                  />
                ) : (
                  <div
                    className="flex h-[180px] w-[60%] max-w-[56px] items-end overflow-hidden rounded-[18px] bg-track"
                    title={m.total ? `${m.label} : ${m.achieved}/${m.total} jalons atteints` : `${m.label} : aucun jalon prévu`}
                  >
                    <div
                      className="w-full rounded-[18px]"
                      style={{
                        height: `${m.pct ?? 0}%`,
                        background: barColor(m.pct ?? 0),
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
              className="pointer-events-none absolute left-0 top-0 h-[180px] w-full overflow-visible"
            >
              {points.slice(1).map((p, i) => {
                const prev = points[i];
                return (
                  <line
                    key={p.m.month}
                    x1={prev.x * 100}
                    y1={prev.y}
                    x2={p.x * 100}
                    y2={p.y}
                    stroke={trendColor(prev.pct, p.pct)}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
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

          <div className="mt-3 grid text-center text-[12px] text-muted" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {trend.map((m) => (
              <span key={m.month} className={m.state === "current" ? "font-semibold text-ink" : ""}>
                {m.label}
                {m.state === "current" && <span className="block text-[11px] font-normal text-muted">en cours</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
