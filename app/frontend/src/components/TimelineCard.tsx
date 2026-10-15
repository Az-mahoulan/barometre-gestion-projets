"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

import { Icon } from "./ui";

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const NAME_W = 200;

// Une teinte par projet : couleur franche (pastille, losanges), teinte moyenne pour la barre, et une icône.
const PALETTE = [
  { solid: "#7c6cf0", bar: "#b8acf6", icon: "campaign" },
  { solid: "#3b82f6", bar: "#9dbff3", icon: "chart" },
  { solid: "#e0567f", bar: "#f2a9c0", icon: "factcheck" },
  { solid: "#1fa37a", bar: "#8fd9b8", icon: "project" },
  { solid: "#e5a216", bar: "#f3cd6b", icon: "rocket" },
  { solid: "#e8743b", bar: "#f5b38f", icon: "training" },
  { solid: "#0ea5b7", bar: "#8fd3dc", icon: "work" },
  { solid: "#64748b", bar: "#b7c0cc", icon: "review" },
];

/**
 * Chronologie de l'année : tableau récapitulatif dont l'en-tête est la suite des dates qui comptent
 * (début et fin des projets, dates clés renseignées par les gestionnaires). Pas d'échelle de temps régulière.
 */
export function TimelineCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const currentYear = parseDate(asOf).getFullYear();
  const [year, setYear] = useState(currentYear);
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const inYear = (d: string) => d >= from && d <= to;

  // Année en cours : projets en cours ; autres années : tous les projets de l'année.
  const rows = projects
    .map((p, i) => ({ p, color: PALETTE[i % PALETTE.length] }))
    .filter(({ p }) => p.start <= to && p.end >= from && (year !== currentYear || p.status === "active"));

  const notes = new Map<string, string[]>();
  const note = (d: string, text: string) => {
    if (inYear(d)) notes.set(d, [...(notes.get(d) ?? []), text]);
  };
  for (const { p } of rows) {
    note(p.start, `Début · ${p.name}`);
    note(p.end, `Fin · ${p.name}`);
    for (const k of p.key_dates) note(k.date, `${k.label} · ${p.name}`);
  }
  const dates = [...notes.keys()].sort();
  const n = Math.max(dates.length, 1);
  const col = (d: string) => dates.indexOf(d);

  // Largeur de la zone des dates, pour placer les libellés sans chevauchement.
  const area = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(0, el.clientWidth - NAME_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const colW = width / n;
  const labelW = (text: string) => text.length * 6.2 + 12;

  // Aujourd'hui : trait entre les dates passées et celles à venir.
  const past = dates.filter((d) => d < asOf).length;
  const todayAt = dates.includes(asOf) ? past + 0.5 : past;
  const showToday = year === currentYear && rows.length > 0;

  return (
    <section className="card" aria-label="Chronologie des projets">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Chronologie des projets</h2>
        <span className="flex items-center rounded-full border border-line">
          <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" onClick={() => setYear(year - 1)} aria-label="Année précédente">
            <Icon name="left" className="h-4 w-4" />
          </button>
          <span className="min-w-[52px] text-center text-[12.5px] font-semibold">{year}</span>
          <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" onClick={() => setYear(year + 1)} aria-label="Année suivante">
            <Icon name="right" className="h-4 w-4" />
          </button>
        </span>
      </div>

      <div ref={area} className="relative overflow-clip rounded-[14px] border border-line">
        <div className="relative z-20 grid border-b border-line bg-[#f6f6f2]" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
          <div className="flex items-center px-4 text-[12px] font-semibold">Projets</div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {dates.map((d) => {
              const day = parseDate(d);
              return (
                <div key={d} className="border-l border-line px-0.5 py-1.5 text-center" title={(notes.get(d) ?? []).join("\n")}>
                  <div className="text-[12.5px] font-semibold leading-tight">{day.getDate()}</div>
                  <div className="text-[10px] text-muted">{MONTHS[day.getMonth()]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {rows.length === 0 && <p className="px-3 py-6 text-center text-[12.5px] text-muted">Aucun projet sur cette année.</p>}
        {rows.map(({ p, color }) => {
          // Projet commencé l'année précédente (ou fini la suivante) : la barre touche le bord, sans arrondi.
          const cutL = p.start < from;
          const cutR = p.end > to;
          const a = cutL ? 0 : col(p.start);
          const b = cutR ? n - 1 : col(p.end);
          const left = (a / n) * 100;
          const right = ((b + 1) / n) * 100;
          const keys = p.key_dates.filter((k) => inYear(k.date));

          // Libellés : à droite du losange s'il est après la fin du projet (comme « Lancement »), sinon sous la barre.
          const placed: [number, number][] = [];
          const named = new Map<string, "side" | "below">();
          for (const k of keys) {
            const x = (col(k.date) + 0.5) * colW;
            const w = labelW(k.label);
            const side = k.date > p.end && x + 10 + w <= width;
            const box: [number, number] = side ? [x + 6, x + 10 + w] : x + w > width ? [x - w, x + 6] : [x - 6, x + w];
            if (!side && placed.some(([s, t]) => box[0] < t && s < box[1])) continue;
            if (!side) placed.push(box);
            named.set(k.label + k.date, side ? "side" : "below");
          }
          const below = [...named.values()].includes("below");

          return (
            <div key={p.id} className="grid border-b border-line last:border-b-0" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
              <div className="flex min-w-0 items-center gap-2.5 bg-[#fafaf7] px-4" title={`${p.name} · ${shortDate(p.start)} → ${shortDate(p.end)}`}>
                <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] text-white" style={{ background: color.solid }}>
                  <Icon name={color.icon} className="h-3 w-3" />
                </span>
                <span className={`truncate text-[12px] font-medium ${p.status !== "active" ? "text-muted" : "text-ink-2"}`}>{p.name}</span>
              </div>

              <div className={`relative ${below ? "h-[50px]" : "h-[40px]"}`}>
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden="true">
                  {dates.map((d) => (
                    <div key={d} className="border-l border-line" />
                  ))}
                </div>

                <div
                  className="absolute top-[13px] h-[14px]"
                  style={{
                    left: cutL ? 0 : `calc(${left}% + 4px)`,
                    width: `calc(${right - left}% - ${(cutL ? 0 : 4) + (cutR ? 0 : 4)}px)`,
                    background: color.bar,
                    borderRadius: `${cutL ? 0 : 5}px ${cutR ? 0 : 5}px ${cutR ? 0 : 5}px ${cutL ? 0 : 5}px`,
                  }}
                  title={`${p.name} · ${shortDate(p.start)} → ${shortDate(p.end)}`}
                />

                {keys.map((k) => {
                  const xPct = ((col(k.date) + 0.5) / n) * 100;
                  const where = named.get(k.label + k.date);
                  const flip = (col(k.date) + 0.5) * colW + labelW(k.label) > width;
                  return (
                    <div key={k.label + k.date}>
                      <i
                        className="absolute top-[15px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] ring-2 ring-surface"
                        style={{ left: `${xPct}%`, background: color.solid }}
                        title={`${k.label} · ${shortDate(k.date)}`}
                      />
                      {where === "side" && (
                        <span className="absolute top-[12px] whitespace-nowrap text-[11px] font-medium text-ink-2" style={{ left: `calc(${xPct}% + 12px)` }}>
                          {k.label}
                        </span>
                      )}
                      {where === "below" && (
                        <span
                          className="absolute top-[30px] whitespace-nowrap text-[10.5px] font-medium text-ink-2"
                          style={{ left: `${xPct}%`, transform: flip ? "translateX(calc(-100% + 6px))" : "translateX(-6px)" }}
                        >
                          {k.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {showToday && (
          <div
            className="pointer-events-none absolute inset-y-0 z-10"
            style={{ left: `calc(${NAME_W}px + (100% - ${NAME_W}px) * ${todayAt / n})` }}
            aria-hidden="true"
          >
            <span className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-lime" />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-5 rounded-[3px] bg-[#b8acf6]" />
          Début → fin du projet
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rotate-45 rounded-[1px] bg-[#7c6cf0]" />
          Date clé
        </span>
        {showToday && (
          <span className="inline-flex items-center gap-1.5">
            <i className="h-3 w-0.5 rounded-full bg-lime" />
            Aujourd’hui
          </span>
        )}
      </div>
    </section>
  );
}
