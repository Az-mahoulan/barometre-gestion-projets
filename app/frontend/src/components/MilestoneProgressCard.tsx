"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

import { ProjectPicker } from "./ProjectPicker";
import { CardHeader } from "./ui";

type Milestone = GanttProject["milestones"][number];

/** Part de la période du jalon (du jalon précédent à son échéance) déjà écoulée à la date du jour. */
function expectedAt(m: Milestone, asOf: string) {
  const start = parseDate(m.start).getTime();
  const end = parseDate(m.date).getTime();
  const now = parseDate(asOf).getTime();
  if (end <= start) return now >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

// Couleurs selon l'écart au prévu, sur le principe de l'évolution mois par mois (rouge, jaune, vert).
const TOLERANCE = 0.05; // ± 5 points : conforme au prévu
const STATUS = {
  below: { color: "#c7321f", label: "Sous le prévu" },
  on: { color: "#e5a50a", label: "Comme prévu" },
  above: { color: "#1f7a4d", label: "Au-dessus" },
} as const;
type Status = keyof typeof STATUS;

const showMarkAt = (e: number) => e > 0 && e < 1;

/**
 * Progression des jalons : une bande de même longueur par jalon. La partie pleine montre l'avancement réel
 * (tâches des activités rattachées), colorée selon l'écart au prévu ; le trait épais marque l'avancement prévu à date.
 * Nom et pourcentages au-dessus de la bande, échéance dedans.
 */
export function MilestoneProgressCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const [value, setValue] = useState("");
  const project = projects.find((p) => String(p.id) === value);

  // Seulement les jalons en cours d'exécution : période commencée, échéance pas encore passée, non atteints.
  const running = (m: Milestone) => !m.achieved && m.start <= asOf && asOf <= m.date;
  const rows = (project ? [project] : projects.filter((p) => p.status === "active"))
    .flatMap((p) => p.milestones.filter(running).map((m) => ({ m, p })))
    .sort((a, b) => a.m.date.localeCompare(b.m.date));

  // Largeur réelle d'une bande : sert à placer les pourcentages sans chevauchement.
  const list = useRef<HTMLUListElement>(null);
  const [bandW, setBandW] = useState(640);
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const li = el.querySelector("li");
      if (li) setBandW(li.getBoundingClientRect().width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows.length]);

  // Même hauteur que la carte « Activités de la semaine » (colonne de droite) ; la liste défile à l'intérieur.
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const twin = document.querySelector('[aria-label="Activités de la semaine"]');
    if (!twin) return;
    const ro = new ResizeObserver(() => setHeight(twin.getBoundingClientRect().height));
    ro.observe(twin);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="card flex flex-col" aria-label="Progression des jalons" style={height ? { height } : undefined}>
      <CardHeader
        title="Progression des jalons"
        aside={<ProjectPicker projects={projects} value={value} onChange={setValue} label="Jalons du projet" />}
      />

      {rows.length === 0 ? (
        <p className="text-[12.5px] text-muted">Aucun jalon en cours d’exécution.</p>
      ) : (
        <div className="relative mt-2 flex min-h-0 flex-1 flex-col rounded-[14px] bg-[#f8f8f4] px-3 pt-2">
          {/* Axe des pourcentages, aligné sur les bandes */}
          <div className="relative h-4 w-full shrink-0 text-[10px] font-semibold text-muted sm:w-[80%]" aria-hidden="true">
            {[0, 25, 50, 75, 100].map((v) => (
              <span
                key={v}
                className="absolute top-0 whitespace-nowrap"
                style={{ left: `${v}%`, transform: v === 0 ? "none" : v === 100 ? "translateX(-100%)" : "translateX(-50%)" }}
              >
                {v} %
              </span>
            ))}
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Repères verticaux discrets à 25, 50 et 75 % */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-[80%]" aria-hidden="true">
            {[25, 50, 75].map((v) => (
              <span key={v} className="absolute inset-y-0 border-l border-dashed border-line-strong/60" style={{ left: `${v}%` }} />
            ))}
          </div>
        <ul ref={list} className="relative flex min-h-0 flex-1 flex-col gap-9 overflow-y-auto pb-6 pt-7 [scrollbar-width:none]">
          {rows.map(({ m, p }, i) => {
            const pct = Math.round(m.progress * 100);
            const expected = expectedAt(m, asOf);
            const exp = Math.round(expected * 100);
            const status: Status = m.progress < expected - TOLERANCE ? "below" : m.progress > expected + TOLERANCE ? "above" : "on";
            const color = STATUS[status].color;
            const showMark = showMarkAt(expected);

            // Ligne au-dessus de la bande : nom du jalon à gauche, puis les pourcentages au-dessus de leur repère
            // (réalisé au bout de la partie remplie, prévu au-dessus du trait), sans jamais se chevaucher.
            const nameEnd = Math.min(m.name.length * 6.5 + 12, bandW * 0.55);
            const realText = `${i === 0 ? "réalisé · " : ""}${pct} %${status === "below" ? " ▼" : status === "above" ? " ▲" : ""}`;
            const expText = `${i === 0 ? "prévu · " : ""}${exp} %`;
            const width = (t: string) => t.length * 6.1 + 4;
            const labels = [
              { key: "real", text: realText, x: (pct / 100) * bandW, w: width(realText) },
              ...(showMark ? [{ key: "exp", text: expText, x: expected * bandW, w: width(expText) }] : []),
            ]
              .map((l) => ({ ...l, left: l.x - l.w / 2 }))
              .sort((u, v) => u.x - v.x);
            labels.forEach((l, k) => {
              const min = k === 0 ? nameEnd : labels[k - 1].left + labels[k - 1].w + 8;
              l.left = Math.min(Math.max(l.left, min), bandW - l.w);
            });
            return (
              <li
                key={m.id}
                className="relative h-9 w-full shrink-0 rounded-[10px] sm:w-[80%]"
                style={{ background: `color-mix(in srgb, ${color} 30%, white)` }}
                title={`${p.name} · ${m.name} : ${pct} % réalisé, ${exp} % prévu à date (${m.tasks_complete}/${m.tasks_total} tâches) · échéance ${shortDate(m.date)}`}
              >
                <span className="absolute -top-[20px] left-0 truncate text-[12px] font-semibold text-ink" style={{ maxWidth: nameEnd - 8 }}>
                  {m.name}
                </span>
                {labels.map((l) => (
                  <span
                    key={l.key}
                    className="absolute -top-[19px] whitespace-nowrap text-[10.5px] font-bold"
                    style={{ left: l.left, color: l.key === "real" ? color : "var(--ink-2)" }}
                  >
                    {l.text}
                  </span>
                ))}
                {/* Avancement réel : couleur pleine selon l'écart au prévu */}
                {pct > 0 && (
                  <span className={`absolute inset-y-0 left-0 ${pct >= 97 ? "rounded-[10px]" : "rounded-l-[10px]"}`} style={{ width: `${pct}%`, background: color }} />
                )}
                {/* Avancement prévu à date : trait épais sur toute la hauteur */}
                {showMark && (
                  <span className="absolute inset-y-0 w-[5px] -translate-x-1/2 bg-ink" style={{ left: `${expected * 100}%` }} aria-hidden="true" />
                )}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-ink-2">{shortDate(m.date)}</span>
              </li>
            );
          })}
        </ul>
          </div>
          {/* Fondu du bas : d'autres jalons suivent en faisant défiler */}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-[14px] bg-gradient-to-t from-[#f8f8f4] to-transparent" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {(Object.keys(STATUS) as Status[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <i className="h-2.5 w-5 rounded-[3px]" style={{ background: STATUS[k].color }} />
            {STATUS[k].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <i className="h-3.5 w-[5px] bg-ink" />
          Prévu à date
        </span>
      </div>
    </section>
  );
}
