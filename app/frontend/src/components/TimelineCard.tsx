"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

import { Icon } from "./ui";

type Zoom = "month" | "quarter";
const ZOOMS: { key: Zoom; label: string }[] = [
  { key: "month", label: "Mois" },
  { key: "quarter", label: "Trimestre" },
];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_LONG = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
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

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function windowFor(zoom: Zoom, today: Date, offset: number) {
  const size = zoom === "month" ? 1 : 3;
  const index = Math.floor(today.getMonth() / size) + offset;
  const from = new Date(today.getFullYear(), index * size, 1);
  const to = new Date(from.getFullYear(), from.getMonth() + size, 1);
  const title = size === 1 ? `${MONTHS_LONG[from.getMonth()]} ${from.getFullYear()}` : `T${Math.floor(from.getMonth() / 3) + 1} ${from.getFullYear()}`;
  return { from: iso(from), to: iso(to), title };
}

/**
 * Chronologie des projets. L'en-tête ne suit pas une échelle régulière : chaque colonne est une date qui compte
 * (début, fin, jalon, revue ou rencontre d'un projet, et aujourd'hui). Les barres vont de la colonne du début à
 * celle de la fin ; les jalons prévus sont des points sur la barre, les moments hors programmation des losanges nommés.
 */
export function TimelineCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const today = parseDate(asOf);
  const [zoom, setZoom] = useState<Zoom>("month");
  const [offset, setOffset] = useState(0);
  const { from, to, title } = windowFor(zoom, today, offset);
  const within = (d: string) => d >= from && d < to;

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

  const rows = projects
    .map((p, i) => ({ p, color: PALETTE[i % PALETTE.length] }))
    .filter(({ p }) => p.end >= from && p.start < to);

  // Colonnes : toutes les dates marquantes de la période, plus aujourd'hui.
  const notes = new Map<string, string[]>();
  const note = (d: string, text: string) => {
    if (within(d)) notes.set(d, [...(notes.get(d) ?? []), text]);
  };
  for (const { p } of rows) {
    note(p.start, `Début · ${p.name}`);
    note(p.end, `Fin · ${p.name}`);
    for (const m of p.milestones) note(m.date, `Jalon « ${m.name} » · ${p.name}`);
    for (const e of p.events) note(e.date, `${e.title} · ${p.name}`);
  }
  if (within(asOf) && !notes.has(asOf)) notes.set(asOf, []);
  const dates = [...notes.keys()].sort();
  const n = Math.max(dates.length, 1);
  const colW = width / n;
  const col = (d: string) => dates.indexOf(d);
  const labelW = (text: string) => text.length * 6.2 + 14;

  // Ouvre la période sur aujourd'hui (ou au début) et met à jour les fondus.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const i = dates.indexOf(asOf);
    el.scrollLeft = i > 0 ? Math.max(0, NAME_W + (i / n) * (el.scrollWidth - NAME_W) - el.clientWidth / 2) : 0;
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, offset, n, width]);

  const switchZoom = (z: Zoom) => {
    setZoom(z);
    setOffset(0);
  };

  return (
    <section className="card" aria-label="Chronologie des projets">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Chronologie des projets</h2>
        <div className="flex items-center gap-2">
          <span className="flex items-center rounded-full border border-line">
            <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" onClick={() => setOffset(offset - 1)} aria-label="Période précédente">
              <Icon name="left" className="h-4 w-4" />
            </button>
            <button className="min-w-[110px] px-1 text-center text-[12.5px] font-semibold" onClick={() => setOffset(0)} title="Revenir à la période actuelle">
              {title}
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" onClick={() => setOffset(offset + 1)} aria-label="Période suivante">
              <Icon name="right" className="h-4 w-4" />
            </button>
          </span>
          <span role="tablist" aria-label="Période" className="flex rounded-full bg-surface-2 p-1">
            {ZOOMS.map((z) => (
              <button
                key={z.key}
                role="tab"
                aria-selected={zoom === z.key}
                onClick={() => switchZoom(z.key)}
                className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                  zoom === z.key ? "bg-surface text-ink shadow-[0_1px_3px_rgba(28,29,34,0.12)]" : "text-muted hover:text-ink"
                }`}
              >
                {z.label}
              </button>
            ))}
          </span>
        </div>
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
          <div className="grid border-b border-line bg-surface-2/60" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
            <div className="sticky left-0 z-20 flex items-center border-r border-line bg-[#f8f8f5] px-3 text-[12px] font-bold">Projets</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {dates.map((d) => {
                const day = parseDate(d);
                const isToday = d === asOf;
                return (
                  <div key={d} className="border-l border-line px-1 py-2 text-center" title={(notes.get(d) ?? []).join("\n") || "Aujourd’hui"}>
                    <div className="text-[13px] font-bold leading-tight">
                      <span className={isToday ? "inline-grid h-6 min-w-6 place-items-center rounded-full bg-lime px-1" : ""}>{day.getDate()}</span>
                    </div>
                    <div className="text-[10.5px] text-muted">{zoom === "month" ? DAYS[day.getDay()] : MONTHS[day.getMonth()]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {rows.length === 0 && <p className="px-3 py-6 text-center text-[12.5px] text-muted">Aucun projet sur cette période.</p>}
          {rows.map(({ p, color }) => {
            // Projet commencé avant la période (ou fini après) : la barre touche le bord, sans arrondi.
            const cutL = p.start < from;
            const cutR = p.end >= to;
            const a = cutL ? 0 : col(p.start);
            const b = cutR ? n - 1 : col(p.end);
            const left = (a / n) * 100;
            const right = ((b + 1) / n) * 100;
            const milestones = p.milestones.filter((m) => within(m.date));
            const events = p.events.filter((e) => within(e.date));

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
                      <div key={d} className={`border-l border-line ${d === asOf ? "bg-lime/15" : ""}`} />
                    ))}
                  </div>

                  <div
                    className="absolute top-[12px] h-[18px]"
                    style={{
                      left: cutL ? 0 : `calc(${left}% + 4px)`,
                      width: `calc(${right - left}% - ${(cutL ? 0 : 4) + (cutR ? 0 : 4)}px)`,
                      background: color.soft,
                      borderRadius: `${cutL ? 0 : 9}px ${cutR ? 0 : 9}px ${cutR ? 0 : 9}px ${cutL ? 0 : 9}px`,
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
          <i className="h-3 w-3 rounded-full bg-lime" />
          Aujourd’hui
        </span>
      </div>
    </section>
  );
}
