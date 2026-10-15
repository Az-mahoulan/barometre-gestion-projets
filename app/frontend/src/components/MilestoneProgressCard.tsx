"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import { projectColor } from "@/lib/projectColors";
import type { GanttProject } from "@/lib/types";

import { ProjectPicker } from "./ProjectPicker";
import { Avatar, CardHeader } from "./ui";

type Milestone = GanttProject["milestones"][number];

/** Part de la période du jalon (du jalon précédent à son échéance) déjà écoulée à la date du jour. */
function expectedAt(m: Milestone, asOf: string) {
  const start = parseDate(m.start).getTime();
  const end = parseDate(m.date).getTime();
  const now = parseDate(asOf).getTime();
  if (end <= start) return now >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

/** Membres du jalon : deux photos, puis le nombre de personnes restantes. */
function Members({ members }: { members: Milestone["members"] }) {
  const shown = members.slice(0, 2);
  const rest = members.length - shown.length;
  const edge = "shadow-[0_0_0_1.5px_var(--surface)]";
  return (
    <span className="flex shrink-0 items-center" title={members.map((u) => u.name).join(", ")}>
      {shown.map((u, i) => (
        <span key={u.name} className={`grid h-7 w-7 shrink-0 rounded-full ${edge} ${i > 0 ? "-ml-2" : ""}`}>
          <Avatar initials={u.initials} seed={u.name} size="h-7 w-7 text-[10px]" />
        </span>
      ))}
      {rest > 0 && (
        <span className={`-ml-2 grid h-7 min-w-7 place-items-center rounded-full bg-surface px-1 text-[10.5px] font-bold text-ink-2 ${edge}`}>
          +{rest}
        </span>
      )}
    </span>
  );
}

/**
 * Progression des jalons : une bande de même longueur par jalon. La partie plus pure montre l'avancement réel
 * (tâches des activités rattachées) ; le trait épais marque l'avancement prévu à date. Tout est écrit dans la bande.
 */
export function MilestoneProgressCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const [value, setValue] = useState("");
  const project = projects.find((p) => String(p.id) === value);

  // Un projet : tous ses jalons. Tous les projets : les jalons non atteints des projets en cours, par échéance.
  const rows = project
    ? project.milestones.map((m) => ({ m, p: project }))
    : projects
        .filter((p) => p.status === "active")
        .flatMap((p) => p.milestones.filter((m) => !m.achieved).map((m) => ({ m, p })))
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

  return (
    <section className="card" aria-label="Progression des jalons">
      <CardHeader
        title="Progression des jalons"
        aside={<ProjectPicker projects={projects} value={value} onChange={setValue} label="Jalons du projet" />}
      />

      {rows.length === 0 ? (
        <p className="text-[12.5px] text-muted">Aucun jalon à suivre.</p>
      ) : (
        <ul ref={list} className="mt-2 flex max-h-[560px] flex-col gap-7 overflow-y-auto py-1 [scrollbar-width:none]">
          {rows.map(({ m, p }) => {
            const c = projectColor(projects, p.id);
            const pct = Math.round(m.progress * 100);
            const expected = expectedAt(m, asOf);
            const exp = Math.round(expected * 100);
            const behind = !m.achieved && m.progress < expected - 0.05;

            // Placement (px, estimé) : membres + nom à gauche, échéance à droite.
            const membersW = 28 + Math.min(m.members.length - 1, 2) * 20;
            const nameW = m.name.length * 6.6 + (project ? 0 : (p.name.length + 3) * 6);
            const leftEnd = 6 + membersW + 10 + nameW + 10;
            const rightStart = bandW - 62; // zone de l'échéance
            const fillPx = (pct / 100) * bandW;
            const markPx = expected * bandW;
            const PCT_W = 40;
            // % atteint : dans la partie réalisée (à son extrémité) s'il y a la place, sinon juste après le nom.
            const pctInside = fillPx >= leftEnd + PCT_W;
            const pctLeft = fillPx - PCT_W - 4;
            const pctBox: [number, number] = pctInside ? [pctLeft, pctLeft + PCT_W] : [leftEnd, leftEnd + PCT_W + 8];
            // % prévu : juste après le trait, sinon juste avant, sinon à droite avant l'échéance.
            const EXP_W = 72;
            const free = (x: number) => x >= pctBox[1] + 6 || (x >= leftEnd && x + EXP_W <= pctBox[0] - 6);
            const fits = (x: number) => x + EXP_W <= rightStart && free(x);
            const expLeft = fits(markPx + 8) ? markPx + 8 : fits(markPx - 8 - EXP_W) ? markPx - 8 - EXP_W : null;
            const showMark = expected > 0 && expected < 1;
            const pctLabel = (
              <b className={`shrink-0 text-[12.5px] font-bold ${m.overdue || behind ? "text-late" : "text-ink"}`}>{pct} %</b>
            );
            return (
              <li
                key={m.id}
                className="relative h-9 w-full shrink-0 overflow-hidden rounded-full sm:w-[80%]"
                style={{ background: `color-mix(in srgb, ${c.bar} 28%, white)` }}
                title={`${p.name} · ${m.name} : ${pct} % réalisé, ${exp} % prévu à date (${m.tasks_complete}/${m.tasks_total} tâches) · échéance ${shortDate(m.date)}`}
              >
                {/* Avancement réel : même teinte, plus pure */}
                {pct > 0 && <span className="absolute inset-y-0 left-0 rounded-l-full" style={{ width: `${pct}%`, background: c.bar }} />}
                {/* Avancement prévu à date : trait épais sur toute la hauteur, couleur foncée du projet */}
                {showMark && (
                  <span className="absolute inset-y-0 w-[5px] -translate-x-1/2" style={{ left: `${expected * 100}%`, background: c.solid }} aria-hidden="true" />
                )}
                <div className="relative flex h-full items-center gap-2.5 pl-1">
                  <Members members={m.members} />
                  <span className="truncate text-[12.5px] font-semibold text-ink">
                    {m.name}
                    {!project && <span className="font-normal text-ink-2"> · {p.name}</span>}
                  </span>
                  {!pctInside && pctLabel}
                </div>
                {pctInside && (
                  <span className="absolute top-1/2 w-10 -translate-y-1/2 text-right" style={{ left: pctLeft }}>
                    {pctLabel}
                  </span>
                )}
                {expLeft !== null && showMark ? (
                  <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-semibold" style={{ left: expLeft, color: c.solid }}>
                    prévu {exp} %
                  </span>
                ) : (
                  <span className="absolute right-[68px] top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-semibold" style={{ color: c.solid }}>
                    prévu {exp} %
                  </span>
                )}
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] ${m.overdue ? "font-semibold text-late" : "text-ink-2"}`}>
                  {shortDate(m.date)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-6 rounded-full bg-[#9cc0ff]" />
          Avancement réel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-3.5 w-[5px] bg-[#1e6bff]" />
          Prévu à date
        </span>
        <span>Date : échéance du jalon</span>
      </div>
    </section>
  );
}
