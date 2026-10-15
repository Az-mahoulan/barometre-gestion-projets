"use client";

import { useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

import { Icon } from "./ui";

type Zoom = "month" | "quarter" | "half";
const ZOOMS: { key: Zoom; label: string }[] = [
  { key: "month", label: "Mois" },
  { key: "quarter", label: "Trimestre" },
  { key: "half", label: "Semestre" },
];
const MONTHS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const MONTHS_LONG = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY = 86_400_000;

// Une teinte par projet : couleur franche (carré, jalons prévus) et version douce (barre de durée).
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

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

interface Col {
  key: string;
  label: string;
  from: Date;
  to: Date;
}

/** Fenêtre affichée et ses colonnes ; `offset` décale d'un mois, d'un trimestre ou d'un semestre. */
function windowFor(zoom: Zoom, today: Date, offset: number): { from: Date; to: Date; cols: Col[]; title: string } {
  if (zoom === "month") {
    const from = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    const cols: Col[] = [];
    for (let s = from; s < to; ) {
      const e = new Date(Math.min(addDays(mondayOf(s), 7).getTime(), to.getTime()));
      cols.push({ key: s.toDateString(), label: `${s.getDate()}–${addDays(e, -1).getDate()}`, from: s, to: e });
      s = e;
    }
    return { from, to, cols, title: `${MONTHS_LONG[from.getMonth()]} ${from.getFullYear()}` };
  }
  const size = zoom === "quarter" ? 3 : 6;
  const index = Math.floor(today.getMonth() / size) + offset;
  const from = new Date(today.getFullYear(), index * size, 1);
  const to = new Date(from.getFullYear(), from.getMonth() + size, 1);
  const cols = Array.from({ length: size }, (_, i) => {
    const m = new Date(from.getFullYear(), from.getMonth() + i, 1);
    return { key: m.toDateString(), label: size === 3 ? MONTHS_LONG[m.getMonth()] : MONTHS[m.getMonth()], from: m, to: new Date(m.getFullYear(), m.getMonth() + 1, 1) };
  });
  const n = Math.floor(from.getMonth() / size) + 1;
  return { from, to, cols, title: `${size === 3 ? "T" : "S"}${n} ${from.getFullYear()}` };
}

/** Chronologie des projets : durée de chaque projet (début → fin) et ses dates clés (jalons). */
export function TimelineCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const today = parseDate(asOf);
  const [zoom, setZoom] = useState<Zoom>("half");
  const [offset, setOffset] = useState(0);
  const { from, to, cols, title } = windowFor(zoom, today, offset);
  const span = to.getTime() - from.getTime();
  const pos = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - from.getTime()) / span) * 100));
  // Un jour est placé en son milieu (jalons, aujourd'hui).
  const mid = (d: Date) => pos(new Date(d.getTime() + DAY / 2));

  const rows = projects
    .map((p, i) => ({ p, color: PALETTE[i % PALETTE.length], start: parseDate(p.start), end: addDays(parseDate(p.end), 1) }))
    .filter((r) => r.end > from && r.start < to);
  const todayIn = today >= from && today < to;

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
          <span role="tablist" aria-label="Échelle" className="flex rounded-full bg-surface-2 p-1">
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

      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative min-w-[640px] overflow-hidden rounded-[14px] border border-line">
          <div className="grid grid-cols-[230px_minmax(0,1fr)] border-b border-line bg-surface-2/60">
            <div className="px-3 py-2.5 text-[12px] font-bold">Projets</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
              {cols.map((c) => {
                const current = today >= c.from && today < c.to;
                return (
                  <div key={c.key} className="flex items-center border-l border-line px-2 py-2 text-[12px] font-semibold text-ink-2">
                    <span className={current ? "-ml-1 rounded-full bg-lime px-2 py-0.5 text-ink" : ""}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {rows.length === 0 && <p className="px-3 py-6 text-center text-[12.5px] text-muted">Aucun projet sur cette période.</p>}
          {rows.map(({ p, color, start, end }) => {
            const cutL = start < from;
            const cutR = end > to;
            const left = pos(start);
            const right = pos(end);
            const milestones = p.milestones.filter((m) => {
              const d = parseDate(m.date);
              return d >= from && d < to;
            });
            const next = p.next_milestone;
            // Noms affichés : le prochain jalon toujours ; en vue « Mois », les autres s'ils ne chevauchent pas un nom déjà placé.
            const isNext = (m: (typeof milestones)[number]) => !!next && next.name === m.name && next.date === m.date;
            const placed: [number, number][] = [];
            const labelled = new Set<string>();
            for (const m of [...milestones].sort((a, b) => Number(isNext(b)) - Number(isNext(a)))) {
              if (!isNext(m) && zoom !== "month") continue;
              const x = mid(parseDate(m.date));
              // Emprise approximative du nom (≈ 0,9 % de largeur par caractère), à droite du losange ou à gauche en fin de ligne.
              const w = (m.name.length + 9) * 0.9;
              const box: [number, number] = x > 75 ? [x - w, x + 1] : [x - 1, x + w];
              if (placed.some(([a, b]) => box[0] < b && a < box[1])) continue;
              placed.push(box);
              labelled.add(m.name + m.date);
            }
            return (
              <div key={p.id} className="grid grid-cols-[230px_minmax(0,1fr)] border-b border-line last:border-b-0">
                <div className="flex min-w-0 items-center gap-2.5 px-3 py-2">
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
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }} aria-hidden="true">
                    {cols.map((c) => (
                      <div key={c.key} className="border-l border-line" />
                    ))}
                  </div>

                  {/* Durée du projet : bords droits quand le projet déborde de la période. */}
                  <div
                    className="absolute top-[11px] h-[18px]"
                    style={{
                      left: `calc(${left}% + ${cutL ? 0 : 2}px)`,
                      width: `calc(${right - left}% - ${(cutL ? 0 : 2) + (cutR ? 0 : 2)}px)`,
                      background: color.soft,
                      borderRadius: `${cutL ? 0 : 9}px ${cutR ? 0 : 9}px ${cutR ? 0 : 9}px ${cutL ? 0 : 9}px`,
                    }}
                    title={`${p.name} · ${shortDate(p.start)} → ${shortDate(p.end)}`}
                  />

                  {milestones.map((m) => {
                    const x = mid(parseDate(m.date));
                    const tone = m.overdue ? "var(--bar-late)" : m.achieved ? "var(--bar-ok)" : color.solid;
                    const flip = x > 75;
                    return (
                      <div key={m.name + m.date}>
                        <i
                          className="absolute top-[14px] h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] ring-2 ring-surface"
                          style={{ left: `${x}%`, background: tone }}
                          title={`${m.name} · ${shortDate(m.date)}${m.achieved ? " · atteint" : m.overdue ? " · dépassé" : ""}`}
                        />
                        {labelled.has(m.name + m.date) && (
                          <span
                            className={`absolute top-[31px] z-10 whitespace-nowrap rounded-[6px] bg-surface px-1 text-[10.5px] font-semibold ${m.overdue ? "text-late" : "text-ink-2"}`}
                            style={{ left: `${x}%`, transform: flip ? "translateX(calc(-100% + 6px))" : "translateX(-6px)" }}
                          >
                            {m.name} · {shortDate(m.date)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {todayIn && rows.length > 0 && (
            <div className="pointer-events-none absolute inset-y-0" style={{ left: `calc(230px + (100% - 230px) * ${mid(today) / 100})` }} aria-hidden="true">
              <span className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-ink/80" />
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
          <i className="h-2 w-2 rotate-45 rounded-[1px] bg-[#7c6cf0]" />
          Jalon prévu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rotate-45 rounded-[1px] bg-[var(--bar-ok)]" />
          Jalon atteint
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rotate-45 rounded-[1px] bg-[var(--bar-late)]" />
          Jalon dépassé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-3 w-0.5 rounded-full bg-ink" />
          Aujourd’hui
        </span>
      </div>
    </section>
  );
}
