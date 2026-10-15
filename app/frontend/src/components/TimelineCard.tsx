"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const NAME_W = 200;
const COL_MIN = 40;

// Une teinte par projet : couleur franche (carré, losanges) et version douce (barre).
const PALETTE = [
  { solid: "#7c6cf0", soft: "#d9d3fc" },
  { solid: "#3b82f6", soft: "#c3daf9" },
  { solid: "#e0567f", soft: "#f7cad8" },
  { solid: "#1fa37a", soft: "#b8e6d5" },
  { solid: "#e5a216", soft: "#f6e0a6" },
  { solid: "#e8743b", soft: "#f8d3bd" },
  { solid: "#0ea5b7", soft: "#b7e5ec" },
  { solid: "#64748b", soft: "#d7dce4" },
];


/**
 * Chronologie des projets en cours : tableau récapitulatif dont l'en-tête est la suite, dans l'ordre, de toutes
 * les dates clés (début, fin, jalon, revue ou rencontre d'un projet) ; pas d'échelle de temps régulière.
 * Les barres vont de la colonne du début à celle de la fin ; jalons en points, revues et rencontres en losanges nommés.
 */
export function TimelineCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const thisYear = parseDate(asOf).getFullYear();

  // Largeur réelle de la zone des dates, pour placer les noms sans chevauchement.
  const area = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(0, el.clientWidth - NAME_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Défilement horizontal sans barre : fondu sur le bord quand des dates sont cachées.
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = () => {
    const el = scroller.current;
    if (el) setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  };

  const rows = projects.filter((p) => p.status === "active").map((p, i) => ({ p, color: PALETTE[i % PALETTE.length] }));

  // Colonnes : toutes les dates clés des projets, de la plus ancienne à la plus récente.
  const notes = new Map<string, string[]>();
  const note = (d: string, text: string) => notes.set(d, [...(notes.get(d) ?? []), text]);
  for (const { p } of rows) {
    note(p.start, `Début · ${p.name}`);
    note(p.end, `Fin · ${p.name}`);
    for (const m of p.milestones) note(m.date, `Jalon « ${m.name} » · ${p.name}`);
    for (const e of p.events) note(e.date, `${e.title} · ${p.name}`);
  }
  const dates = [...notes.keys()].sort();
  const n = Math.max(dates.length, 1);
  const colW = width / n;
  const col = (d: string) => dates.indexOf(d);
  const labelW = (text: string) => text.length * 6.2 + 14;

  // Aujourd'hui : un trait entre les dates déjà passées et celles à venir (au milieu de la colonne si c'est une date clé).
  const past = dates.filter((d) => d < asOf).length;
  const todayAt = dates.includes(asOf) ? past + 0.5 : past;

  // Ouvre le tableau autour d'aujourd'hui et met à jour les fondus.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, (todayAt / n) * (el.scrollWidth - NAME_W) - (el.clientWidth - NAME_W) / 2);
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, width]);

  return (
    <section className="card" aria-label="Chronologie des projets">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Chronologie des projets</h2>
        <span className="text-[12px] text-muted">
          {rows.length} projet{rows.length > 1 ? "s" : ""} en cours · {dates.length} dates clés
        </span>
      </div>

      <div
        ref={scroller}
        onScroll={measure}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: `linear-gradient(to right, #000 ${NAME_W}px, ${edges.left ? `transparent ${NAME_W}px, #000 ${NAME_W + 40}px` : "#000 0"}, ${edges.right ? "#000 calc(100% - 48px), transparent" : "#000"})`,
        }}
      >
        <div ref={area} className="relative overflow-clip rounded-[14px] border border-line" style={{ minWidth: NAME_W + n * COL_MIN }}>
          <div className="relative z-20 grid border-b border-line bg-[#f8f8f5]" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
            <div className="sticky left-0 z-20 flex items-center border-r border-line bg-[#f8f8f5] px-3 text-[12px] font-bold">Projets</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {dates.map((d) => {
                const day = parseDate(d);
                const isToday = d === asOf;
                const year = day.getFullYear();
                return (
                  <div key={d} className="border-l border-line px-1 py-2 text-center" title={(notes.get(d) ?? []).join("\n")}>
                    <div className="text-[13px] font-bold leading-tight">
                      <span className={isToday ? "inline-grid h-6 min-w-6 place-items-center rounded-full bg-lime px-1" : ""}>{day.getDate()}</span>
                    </div>
                    <div className="text-[10.5px] text-muted">
                      {MONTHS[day.getMonth()]}
                      {year !== thisYear ? ` ${String(year).slice(2)}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {rows.length === 0 && <p className="px-3 py-6 text-center text-[12.5px] text-muted">Aucun projet sur cette période.</p>}
          {rows.map(({ p, color }) => {
            // Projet commencé avant la période (ou fini après) : la barre touche le bord, sans arrondi.
            const a = col(p.start);
            const b = col(p.end);
            const left = (a / n) * 100;
            const right = ((b + 1) / n) * 100;
            const milestones = p.milestones;
            const events = p.events;

            // Noms des revues et rencontres sous la barre, sans chevauchement (sinon visibles au survol).
            const placed: [number, number][] = [];
            const named = new Set<string>();
            for (const e of events) {
              const x = (col(e.date) + 0.5) * colW;
              const w = labelW(e.title);
              const box: [number, number] = x + w > width ? [x - w, x + 6] : [x - 6, x + w];
              if (placed.some(([s, t]) => box[0] < t && s < box[1])) continue;
              placed.push(box);
              named.add(e.title + e.date);
            }

            return (
              <div key={p.id} className="grid border-b border-line last:border-b-0" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
                <div className="sticky left-0 z-20 flex min-w-0 items-center gap-2.5 border-r border-line bg-surface px-3 py-2">
                  <i className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: color.solid }} />
                  <div className="min-w-0">
                    <b className={`block truncate text-[12.5px] font-semibold ${p.status !== "active" ? "text-muted" : ""}`} title={p.name}>
                      {p.name}
                    </b>
                    <small className="block text-[11px] text-muted">
                      {shortDate(p.start)} → {shortDate(p.end)}
                    </small>
                  </div>
                </div>

                <div className="relative h-[52px]">
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden="true">
                    {dates.map((d) => (
                      <div key={d} className="border-l border-line" />
                    ))}
                  </div>

                  <div
                    className="absolute top-[12px] h-[18px]"
                    style={{
                      left: `calc(${left}% + 4px)`,
                      width: `calc(${right - left}% - 8px)`,
                      background: color.soft,
                      borderRadius: 9,
                    }}
                    title={`${p.name} · ${shortDate(p.start)} → ${shortDate(p.end)}`}
                  />

                  {milestones.map((m) => (
                    <i
                      key={m.name + m.date}
                      className="absolute top-[17px] h-2 w-2 -translate-x-1/2 rounded-full"
                      style={{
                        left: `${((col(m.date) + 0.5) / n) * 100}%`,
                        background: m.overdue ? "var(--bar-late)" : m.achieved ? color.solid : "var(--surface)",
                        boxShadow: `0 0 0 2px ${m.overdue ? "var(--bar-late)" : color.solid}`,
                      }}
                      title={`Jalon « ${m.name} » · ${shortDate(m.date)}${m.achieved ? " · atteint" : m.overdue ? " · dépassé" : ""}`}
                    />
                  ))}

                  {events.map((e) => {
                    const xPct = ((col(e.date) + 0.5) / n) * 100;
                    const flip = (col(e.date) + 0.5) * colW + labelW(e.title) > width;
                    return (
                      <div key={e.title + e.date}>
                        <i
                          className="absolute top-[15px] h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] ring-2 ring-surface"
                          style={{ left: `${xPct}%`, background: color.solid }}
                          title={`${e.title} · ${shortDate(e.date)}`}
                        />
                        {named.has(e.title + e.date) && (
                          <span
                            className="absolute top-[32px] whitespace-nowrap text-[10.5px] font-semibold text-ink-2"
                            style={{ left: `${xPct}%`, transform: flip ? "translateX(calc(-100% + 6px))" : "translateX(-6px)" }}
                          >
                            {e.title}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {rows.length > 0 && (
            <div
              className="pointer-events-none absolute inset-y-0 z-10"
              style={{ left: `calc(${NAME_W}px + (100% - ${NAME_W}px) * ${todayAt / n})` }}
              aria-hidden="true"
            >
              <span className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-lime" />
              <span className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-lime px-1.5 text-[9.5px] font-bold text-ink">
                Aujourd’hui
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-5 rounded-full bg-[#d9d3fc]" />
          Début → fin du projet
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-surface ring-2 ring-[#7c6cf0]" />
          Jalon prévu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[var(--bar-late)]" />
          Jalon dépassé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rotate-45 rounded-[1px] bg-[#7c6cf0]" />
          Revue, rencontre
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-3 w-0.5 rounded-full bg-lime" />
          Aujourd’hui
        </span>
      </div>
    </section>
  );
}
