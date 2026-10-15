"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import { projectColor } from "@/lib/projectColors";
import type { GanttProject } from "@/lib/types";

import { ProjectPicker } from "./ProjectPicker";
import { Avatar, CardHeader } from "./ui";

type Milestone = GanttProject["milestones"][number];
interface Row {
  m: Milestone;
  project: GanttProject;
}

/**
 * Progression des jalons : une bande par jalon, toutes partant du même bord et allant jusqu'à l'échéance,
 * remplie selon l'avancement des activités qui y contribuent. En tête, seulement aujourd'hui et la date de fin.
 */
export function MilestoneProgressCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const [value, setValue] = useState("");
  const project = projects.find((p) => String(p.id) === value);

  // Un projet : tous ses jalons. Tous les projets : les jalons non atteints des projets en cours, par échéance.
  const rows: Row[] = project
    ? project.milestones.map((m) => ({ m, project }))
    : projects
        .filter((p) => p.status === "active")
        .flatMap((p) => p.milestones.filter((m) => !m.achieved).map((m) => ({ m, project: p })))
        .sort((a, b) => a.m.date.localeCompare(b.m.date) || a.m.start.localeCompare(b.m.start));

  const dates = [asOf, ...rows.flatMap((r) => [r.m.start, r.m.date])].sort();
  const from = parseDate(dates[0]).getTime();
  const end = dates.at(-1)!;
  const to = parseDate(end).getTime();
  const at = (iso: string) => ((parseDate(iso).getTime() - from) / Math.max(to - from, 1)) * 100;
  const today = at(asOf);

  // Largeur réelle de la zone des bandes : sert à savoir si le nom d'un jalon tient dans sa bande.
  const track = useRef<HTMLUListElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="card" aria-label="Progression des jalons">
      <CardHeader
        title="Progression des jalons"
        aside={<ProjectPicker projects={projects} value={value} onChange={setValue} label="Jalons du projet" />}
      />

      {rows.length === 0 ? (
        <p className="text-[12.5px] text-muted">Aucun jalon à suivre.</p>
      ) : (
        <div className="mt-1 pr-14">
          <div className="relative">
            {/* En-tête : aujourd'hui et la date de fin, rien d'autre. */}
            <div className="relative h-7">
              <span
                className="absolute top-0 whitespace-nowrap rounded-full bg-lime px-2 py-0.5 text-[10.5px] font-bold text-ink"
                style={{ left: `${today}%`, transform: `translateX(${today > 80 ? "-100%" : today < 12 ? "0" : "-50%"})` }}
              >
                Aujourd’hui · {shortDate(asOf)}
              </span>
              {today < 80 && (
                <span className="absolute right-0 top-0 translate-x-1/2 whitespace-nowrap rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-bold text-ink-2">
                  Fin · {shortDate(end)}
                </span>
              )}
            </div>

            {/* Repères verticaux : aujourd'hui (lime) et fin (pointillé discret) */}
            <span className="pointer-events-none absolute bottom-0 top-5 w-[2px] -translate-x-1/2 bg-lime" style={{ left: `${today}%` }} />
            <span className="pointer-events-none absolute bottom-0 right-0 top-5 border-l border-dashed border-line-strong" />

            <ul ref={track} className="relative flex max-h-[460px] flex-col gap-4 overflow-y-auto py-1.5 [scrollbar-width:none]">
              {rows.map(({ m, project: p }) => {
                const c = projectColor(projects, p.id);
                // Comme le modèle : toutes les bandes partent du même bord ; leur longueur va jusqu'à l'échéance.
                const left = 0;
                const width = Math.max(at(m.date), 0);
                const pct = Math.round(m.progress * 100);
                const tone = m.overdue ? "text-late" : pct === 100 ? "text-ok" : "text-ink-2";
                const leftPx = (left / 100) * w;
                const barPx = Math.max((width / 100) * w, 30);
                const label = `${m.name}${project ? "" : ` · ${p.name}`}`;
                const labelPx = label.length * 6.4 + 12; // largeur estimée du texte (12 px, demi-gras)
                const pctPx = 44;
                const inside = barPx >= 30 + labelPx + 8; // le nom tient dans la bande
                // Sinon : nom à droite de la bande, ou à gauche s'il dépasserait du cadre.
                const after = leftPx + barPx + labelPx + pctPx + 8 <= w + 56;
                const name = (
                  <span className="text-[12px] font-semibold text-ink">
                    {m.name}
                    {!project && <span className="font-normal text-ink-2"> · {p.name}</span>}
                  </span>
                );
                const percent = <b className={`text-[11.5px] font-bold ${tone}`}>{pct} %</b>;
                return (
                  <li key={m.id} className="relative h-[26px] shrink-0" title={`${p.name} · ${m.name} : ${pct} % (${m.tasks_complete}/${m.tasks_total} tâches) · échéance ${shortDate(m.date)}`}>
                    <div
                      className="absolute inset-y-0 rounded-full"
                      style={{ left: leftPx, width: barPx, background: `color-mix(in srgb, ${c.bar} 32%, white)` }}
                    >
                      {/* Partie réalisée : même teinte, plus pure */}
                      {pct > 0 && <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `max(26px, ${pct}%)`, background: c.bar }} />}
                      <div className="relative flex h-full items-center gap-2 whitespace-nowrap">
                        <span className="grid h-[28px] w-[28px] shrink-0 rounded-full shadow-[0_0_0_1.5px_var(--surface)]">
                          <Avatar initials={m.lead.initials} seed={m.lead.name} size="h-[28px] w-[28px] text-[10px]" />
                        </span>
                        {inside && name}
                      </div>
                    </div>
                    {inside ? (
                      <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-2" style={{ left: leftPx + barPx }}>
                        {percent}
                      </span>
                    ) : after ? (
                      <span className="absolute top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap pl-2" style={{ left: leftPx + barPx }}>
                        {name}
                        {percent}
                      </span>
                    ) : (
                      <span className="absolute top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap pr-2" style={{ right: w - leftPx }}>
                        {name}
                        {percent}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
