import type { GanttProject, TrendMonth } from "@/lib/types";

import { Section } from "./ui";

const PLOT_H = 150;

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
  // Chaque mois est une colonne pleine (100 % des jalons prévus) ; la partie remplie correspond aux jalons atteints.
  const points = trend
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.pct !== null)
    .map(({ m, i }) => ({ x: i + 0.5, y: PLOT_H * (1 - (m.pct ?? 0) / 100), pct: m.pct as number, m }));
  const summary = points.map((p) => `${p.m.label} ${p.pct} %`).join(", ");

  return (
    <Section
      title="Jalons atteints par mois"
      bodyClassName="px-5 pb-4 pt-4"
      aside={
        <>
          <label className="sr-only" htmlFor="trend-project">
            Projet
          </label>
          <select id="trend-project" className="field max-w-[180px] !py-1 text-[13px]" value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Tous les projets</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </>
      }
    >
      <div className="relative mt-5">
        <div className="grid" style={{ height: PLOT_H, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {trend.map((m) => (
            <div key={m.month} className="flex items-end justify-center">
              <div
                className="flex h-full w-7 items-end overflow-hidden rounded-[3px]"
                style={{ background: m.state === "future" ? "var(--surface-2)" : "var(--track)", outline: m.state === "future" ? "1px dashed var(--line)" : undefined }}
                title={
                  m.state === "future"
                    ? `${m.label} : ${m.total} jalon${m.total > 1 ? "s" : ""} prévu${m.total > 1 ? "s" : ""}`
                    : m.total
                      ? `${m.label} : ${m.achieved} jalon${m.achieved > 1 ? "s" : ""} atteint${m.achieved > 1 ? "s" : ""} sur ${m.total}`
                      : `${m.label} : aucun jalon prévu`
                }
              >
                {m.state !== "future" && (
                  <div className="w-full" style={{ height: `${m.pct ?? 0}%`, background: m.state === "current" ? "var(--s-done)" : "var(--accent-2)" }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {points.length > 1 && (
          <svg
            viewBox={`0 0 ${cols * 100} ${PLOT_H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Jalons atteints : ${summary}`}
            className="pointer-events-none absolute left-0 top-0 w-full overflow-visible"
            style={{ height: PLOT_H }}
          >
            <polyline
              points={points.map((p) => `${p.x * 100},${p.y}`).join(" ")}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {points.map((p) => (
          <div key={p.m.month} className="pointer-events-none absolute" style={{ left: `${(p.x / cols) * 100}%`, top: p.y }}>
            <span className="absolute -left-[4px] -top-[4px] h-2 w-2 rounded-full border-[1.5px] border-ink bg-surface" />
            <span className="absolute -top-[22px] -translate-x-1/2 whitespace-nowrap rounded-sm bg-surface/90 px-0.5 text-[12px] font-medium">{p.pct} %</span>
          </div>
        ))}

        <div className="mt-2 grid text-center text-[12px] text-muted" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {trend.map((m) => (
            <span key={m.month} className={m.state === "current" ? "font-medium text-ink" : ""}>
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}
