"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import { projectColor } from "@/lib/projectColors";
import type { GanttProject } from "@/lib/types";

import { Icon } from "./ui";

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const NAME_W = 200;
const COL_MIN = 30; // en dessous, le tableau défile horizontalement


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
    .map((p) => ({ p, color: projectColor(projects, p.id) }))
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

  // Défilement horizontal quand il y a beaucoup de dates : sans barre, avec un fondu sur le bord caché.
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = () => {
    const el = scroller.current;
    if (el) setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  };
  const labelW = (text: string) => text.length * 6.2 + 12;

  // Aujourd'hui : trait entre les dates passées et celles à venir.
  const past = dates.filter((d) => d < asOf).length;
  const todayAt = dates.includes(asOf) ? past + 0.5 : past;
  const showToday = year === currentYear && rows.length > 0;

  // À l'ouverture (et au changement d'année), centre le tableau sur aujourd'hui s'il défile.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollLeft = showToday ? Math.max(0, (todayAt / n) * (el.scrollWidth - NAME_W) - (el.clientWidth - NAME_W) / 2) : 0;
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, n, width]);

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

      <div
        ref={scroller}
        onScroll={measure}
        className="overflow-x-auto rounded-[14px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: `linear-gradient(to right, #000 ${NAME_W}px, ${edges.left ? `transparent ${NAME_W}px, #000 ${NAME_W + 40}px` : "#000 0"}, ${edges.right ? "#000 calc(100% - 48px), transparent" : "#000"})`,
        }}
      >
        <div ref={area} className="relative overflow-clip rounded-[14px] border border-line bg-[#f7f7f3]" style={{ minWidth: NAME_W + n * COL_MIN }}>
        <div className="relative z-20 grid border-b border-[#d6d6ce] bg-[#ebebe5]" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
          <div className="sticky left-0 z-20 flex items-center bg-[#ebebe5] px-4 text-[12px] font-semibold">Projets</div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {dates.map((d) => {
              const day = parseDate(d);
              return (
                <div key={d} className="border-l border-[#d6d6ce] px-0.5 py-1.5 text-center" title={(notes.get(d) ?? []).join("\n")}>
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
            const end = (col(k.date) + 1) * colW;
            const side = k.date > p.end && end + 4 + w <= width;
            const box: [number, number] = side ? [end, end + 4 + w] : x + 12 + w > width ? [x - 12 - w, x] : [x, x + 12 + w];
            if (!side && placed.some(([s, t]) => box[0] < t && s < box[1])) continue;
            if (!side) placed.push(box);
            named.set(k.label + k.date, side ? "side" : "below");
          }
          const below = [...named.values()].includes("below");

          return (
            <div key={p.id} className="grid border-b border-line last:border-b-0" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
              <div className="sticky left-0 z-20 flex min-w-0 items-center gap-2.5 bg-[#f7f7f3] px-4" title={`${p.name} · ${shortDate(p.start)} → ${shortDate(p.end)}`}>
                <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] text-white" style={{ background: color.solid }}>
                  <Icon name={color.icon} className="h-3 w-3" />
                </span>
                <span className={`truncate text-[12px] font-medium ${p.status !== "active" ? "text-muted" : "text-ink-2"}`}>{p.name}</span>
              </div>

              <div className={`relative ${below ? "h-[58px]" : "h-[42px]"}`}>
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden="true">
                  {dates.map((d) => (
                    <div key={d} className="border-l border-line" />
                  ))}
                </div>

                <div
                  className="absolute top-[10px] h-[22px]"
                  style={{
                    left: cutL ? 0 : `calc(${left}% + 4px)`,
                    width: `calc(${right - left}% - ${(cutL ? 0 : 4) + (cutR ? 0 : 4)}px)`,
                    background: color.bar,
                    borderRadius: `${cutL ? 0 : 2}px ${cutR ? 0 : 2}px ${cutR ? 0 : 2}px ${cutL ? 0 : 2}px`,
                  }}
                  title={`${p.name} · ${shortDate(p.start)} → ${shortDate(p.end)}`}
                />

                {keys.map((k) => {
                  const xPct = ((col(k.date) + 0.5) / n) * 100;
                  const where = named.get(k.label + k.date);
                  const flip = (col(k.date) + 0.5) * colW + 12 + labelW(k.label) > width;
                  return (
                    <div key={k.label + k.date}>
                      {/* Date clé : une portion de la barre, dans la version franche de sa couleur. */}
                      <i
                        className="absolute top-[10px] h-[22px] rounded-[2px]"
                        style={{ left: `calc(${(col(k.date) / n) * 100}% + 3px)`, width: `calc(${100 / n}% - 6px)`, background: color.solid }}
                        title={`${k.label} · ${shortDate(k.date)}`}
                      />
                      {where === "side" && (
                        <span className="absolute top-[13px] whitespace-nowrap text-[11px] font-medium text-ink-2" style={{ left: `calc(${((col(k.date) + 1) / n) * 100}% + 2px)` }}>
                          {k.label}
                        </span>
                      )}
                      {where === "below" && (
                        <>
                          {/* Petite liaison courbe entre la marque et son étiquette. */}
                          <svg
                            className="absolute top-[32px] h-[11px] w-[13px] overflow-visible"
                            style={{ left: `${xPct}%`, transform: flip ? "translateX(-100%) scaleX(-1)" : undefined, transformOrigin: "center" }}
                            viewBox="0 0 13 11"
                            aria-hidden="true"
                          >
                            <path d="M0.75 0 C0.75 6.5 4 10 12 10" fill="none" stroke={color.solid} strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span
                            className="absolute top-[35px] whitespace-nowrap text-[10.5px] font-medium text-ink-2"
                            style={{ left: `${xPct}%`, transform: flip ? "translateX(calc(-100% - 14px))" : "translateX(14px)" }}
                          >
                            {k.label}
                          </span>
                        </>
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
            <span className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-lime px-1.5 text-[9.5px] font-bold text-ink">
              Aujourd’hui · {shortDate(asOf)}
            </span>
          </div>
        )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-5 rounded-[1px] bg-[#bdb0ff]" />
          Début → fin du projet
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2.5 rounded-[1px] bg-[#7b61ff]" />
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
