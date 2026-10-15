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

const showMarkAt = (e: number) => e > 0 && e < 1;

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
        <div className="relative mt-2 flex min-h-0 flex-1 flex-col">
        <ul ref={list} className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pb-6 pt-5 [scrollbar-width:none]">
          {rows.map(({ m, p }, i) => {
            const c = projectColor(projects, p.id);
            const pct = Math.round(m.progress * 100);
            const expected = expectedAt(m, asOf);
            const exp = Math.round(expected * 100);
            const behind = !m.achieved && m.progress < expected - 0.05;

            const fillPx = (pct / 100) * bandW;
            const markPx = expected * bandW;
            const showMark = showMarkAt(expected);
            // Pourcentages au-dessus de leur repère : réalisé au bout de la partie remplie, prévu au-dessus du trait.
            // Trop proches : celui de gauche s'aligne à droite de son repère, l'autre à gauche, pour ne pas se chevaucher.
            const LABEL_W = i === 0 ? 84 : 44;
            const close = showMark && Math.abs(fillPx - markPx) < LABEL_W;
            const realFirst = fillPx <= markPx;
            const clamp = (x: number) => Math.min(Math.max(x, 26), bandW - 26);
            const place = (x: number, isLeft: boolean) =>
              close ? { left: x, transform: isLeft ? "translateX(calc(-100% - 3px))" : "translateX(3px)" } : { left: clamp(x), transform: "translateX(-50%)" };
            return (
              <li
                key={m.id}
                className="relative h-9 w-full shrink-0 rounded-full [text-shadow:0_1px_1px_rgba(0,0,0,0.18)] sm:w-[80%]"
                style={{ background: `color-mix(in srgb, ${c.solid} 55%, white)` }}
                title={`${p.name} · ${m.name} : ${pct} % réalisé, ${exp} % prévu à date (${m.tasks_complete}/${m.tasks_total} tâches) · échéance ${shortDate(m.date)}`}
              >
                {/* Avancement réel : même teinte, plus pure */}
                {pct > 0 && <span className={`absolute inset-y-0 left-0 ${pct >= 97 ? "rounded-full" : "rounded-l-full"}`} style={{ width: `${pct}%`, background: c.solid }} />}
                {/* Avancement prévu à date : trait épais sur toute la hauteur, couleur foncée du projet */}
                {showMark && (
                  <span className="absolute inset-y-0 w-[5px] -translate-x-1/2" style={{ left: `${expected * 100}%`, background: `color-mix(in srgb, ${c.solid} 55%, black)` }} aria-hidden="true" />
                )}
                <div className="relative flex h-full items-center gap-2.5 pl-1">
                  <Members members={m.members} />
                  <span className="truncate text-[12.5px] font-semibold text-white">
                    {m.name}
                  </span>
                </div>
                {/* % réalisé : au-dessus du bout de la partie remplie */}
                <span
                  className={`absolute -top-[19px] whitespace-nowrap text-[10.5px] font-bold ${behind ? "text-late" : ""}`}
                  style={{ ...place(fillPx, realFirst), ...(behind ? {} : { color: c.solid }) }}
                  title={behind ? "En retard sur le prévu" : undefined}
                >
                  {i === 0 ? `réalisé · ${pct} %` : `${pct} %`}
                  {behind && <span className="ml-0.5 text-[9px]">▼</span>}
                </span>
                {/* % prévu : au-dessus du trait (en toutes lettres sur la première bande, pour la lecture) */}
                {showMark && (
                  <span
                    className="absolute -top-[19px] whitespace-nowrap text-[10.5px] font-bold"
                    style={{ ...place(markPx, !realFirst), color: `color-mix(in srgb, ${c.solid} 55%, black)` }}
                  >
                    {i === 0 ? `prévu · ${exp} %` : `${exp} %`}
                  </span>
                )}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white">
                  {shortDate(m.date)}
                </span>
              </li>
            );
          })}
        </ul>
          {/* Fondu du bas : d'autres jalons suivent en faisant défiler */}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-6 rounded-full bg-[#1e6bff]" />
          Avancement réel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-3.5 w-[5px] bg-[#0e3a8c]" />
          Prévu à date
        </span>
        <span>▼ en retard sur le prévu</span>
      </div>
    </section>
  );
}
