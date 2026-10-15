"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import { projectColor } from "@/lib/projectColors";
import type { GanttProject } from "@/lib/types";

import { Icon } from "./ui";

const DAY = 86_400_000;
const ROW = 32; // épaisseur d'une barre
const GAP = 10;
const VISIBLE = 5; // au-delà, la zone défile
// Reste à courir après aujourd'hui : hachures grises, comme sur le modèle.
const HATCH = "repeating-linear-gradient(135deg, #ececE7 0 5px, #f7f7f4 5px 10px)";
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// « 12–18 oct. » (même mois) ou « 28 sept.–4 oct. » : court, pour tenir à côté du titre.
const weekLabel = (a: string, b: string) => {
  const [da, db] = [parseDate(a), parseDate(b)];
  return da.getMonth() === db.getMonth() ? `${da.getDate()}–${shortDate(b)}` : `${shortDate(a)}–${shortDate(b)}`;
};

/**
 * Activités de la semaine : une pilule par activité, à la couleur de son projet, de la ligne de sa date de début
 * à celle de sa date de fin (bornées à la semaine). Partie écoulée pleine, reste hachuré ; trait d'aujourd'hui.
 */
export function WeekActivitiesCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const today = parseDate(asOf);
  const [offset, setOffset] = useState(0);

  // Défilement : fine barre discrète à droite + fondu en bas tant qu'il reste des activités à voir.
  const scroller = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ ratio: 1, top: 0, more: false });
  const measure = () => {
    const el = scroller.current;
    if (!el) return;
    const ratio = el.clientHeight / Math.max(el.scrollHeight, 1);
    const next = {
      ratio,
      top: el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) : 0,
      more: el.scrollTop + el.clientHeight < el.scrollHeight - 2,
    };
    // Mise à jour seulement si quelque chose a changé (évite une boucle de rendus).
    setScroll((cur) => (cur.ratio === next.ratio && cur.top === next.top && cur.more === next.more ? cur : next));
  };
  const monday = addDays(today, -((today.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const from = iso(monday);
  const to = iso(addDays(monday, 6));
  // Chaque date est une ligne verticale : du lundi (0 %) au dimanche (100 %).
  const at = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - monday.getTime()) / (6 * DAY)) * 100));
  const lineX = (i: number) => (i / 6) * 100;
  const nowPct = at(today);
  const todayIn = asOf >= from && asOf <= to;
  const weekPast = today > addDays(monday, 6);

  useEffect(() => {
    measure();
  });

  const items = projects
    .filter((p) => p.status === "active")
    .flatMap((p) => p.activities.filter((a) => a.start <= to && a.end >= from).map((a) => ({ a, p, color: projectColor(projects, p.id) })))
    // Celles qui se terminent le plus tôt en premier (ce qui arrive à échéance), puis par date de début.
    .sort((x, y) => x.a.end.localeCompare(y.a.end) || x.a.start.localeCompare(y.a.start));

  return (
    <section className="card" aria-label="Activités de la semaine">
      <div className="mb-3 flex items-center justify-between gap-1.5">
        <h2 className="whitespace-nowrap text-[14.5px] font-bold">Activités de la semaine</h2>
        <span className="flex shrink-0 items-center rounded-full border border-line">
          <button className="grid h-7 w-6 place-items-center rounded-full hover:bg-surface-2" onClick={() => setOffset(offset - 1)} aria-label="Semaine précédente">
            <Icon name="left" className="h-4 w-4" />
          </button>
          <button className="whitespace-nowrap text-[11.5px] font-semibold" onClick={() => setOffset(0)} title="Revenir à cette semaine">
            {weekLabel(from, to)}
          </button>
          <button className="grid h-7 w-6 place-items-center rounded-full hover:bg-surface-2" onClick={() => setOffset(offset + 1)} aria-label="Semaine suivante">
            <Icon name="right" className="h-4 w-4" />
          </button>
        </span>
      </div>

      <div className="px-2">
        {/* Repère d'aujourd'hui au-dessus des barres */}
        <div className="relative h-3">
          {todayIn && (
            <span className="absolute top-0 grid h-3 w-3 -translate-x-1/2 place-items-center rounded-full border-2 border-lime bg-surface" style={{ left: `${nowPct}%` }}>
              <i className="h-1 w-1 rounded-full bg-lime" />
            </span>
          )}
        </div>

        {/* Zone des barres : défile au-delà de quelques activités */}
        <div className="relative">
        <div
          ref={scroller}
          onScroll={measure}
          className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            maxHeight: VISIBLE * (ROW + GAP) + GAP,
            maskImage: scroll.more ? "linear-gradient(to bottom, #000 calc(100% - 28px), transparent)" : undefined,
          }}
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {days.map((d, i) => (
                <span key={d.getTime()} className="absolute inset-y-0 border-l border-[#ececE6]" style={{ left: `${lineX(i)}%` }} />
              ))}
            </div>

            <ul className="relative flex flex-col" style={{ gap: GAP, paddingBlock: GAP / 2 }}>
              {items.length === 0 && <li className="py-6 text-center text-[12.5px] text-muted">Aucune activité cette semaine.</li>}
              {items.map(({ a, p, color }) => {
                const single = a.start === a.end;
                const left = Math.max(0, at(parseDate(a.start)) - (single ? 4 : 0));
                const right = Math.min(100, at(parseDate(a.end)) + (single ? 4 : 0));
                // Part écoulée (jusqu'à aujourd'hui), en % de la barre.
                const done = weekPast ? 100 : todayIn ? Math.min(100, Math.max(0, ((nowPct - left) / Math.max(0.01, right - left)) * 100)) : 0;
                return (
                  <li
                    key={a.id}
                    className="relative"
                    style={{ height: ROW }}
                    title={`${a.name} · ${p.name} · ${shortDate(a.start)} → ${shortDate(a.end)} · ${a.tasks_complete}/${a.tasks_total} tâches`}
                  >
                    <div className="absolute inset-y-0 overflow-hidden rounded-full" style={{ left: `${left}%`, width: `${right - left}%`, background: HATCH }}>
                      {/* Nom en gris foncé sur la partie hachurée… */}
                      <span className="relative flex h-full items-center gap-1.5 px-3 text-[12px] font-medium text-ink-2">
                        {done === 0 && <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: color.solid }} />}
                        <span className="truncate">{a.name}</span>
                      </span>
                      {/* … et en blanc sur la partie pleine : même texte, découpé à la limite d'aujourd'hui. */}
                      {done > 0 && (
                        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${done}%`, background: color.solid }}>
                          <span className="flex h-full items-center px-3 text-[12px] font-semibold text-white" style={{ width: `${10000 / done}%` }}>
                            <span className="truncate">{a.name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {todayIn && <span className="pointer-events-none absolute inset-y-0 z-10 w-[2px] -translate-x-1/2 bg-lime" style={{ left: `${nowPct}%` }} aria-hidden="true" />}
          </div>
        </div>
        {scroll.ratio < 1 && (
          <span className="pointer-events-none absolute inset-y-1 -right-2.5 w-[3px] rounded-full bg-[#efefea]" aria-hidden="true">
            <span
              className="absolute w-full rounded-full bg-[#c9cac3]"
              style={{ height: `${scroll.ratio * 100}%`, top: `${scroll.top * (1 - scroll.ratio) * 100}%` }}
            />
          </span>
        )}
        </div>

        {/* Dates en bas, chacune sous sa ligne */}
        <div className="relative mt-1.5 h-6 text-[12px]">
          {days.map((d, i) => (
            <span
              key={d.getTime()}
              className={`absolute -translate-x-1/2 ${iso(d) === asOf ? "-top-0.5 grid h-6 min-w-6 place-items-center rounded-full bg-lime px-1 font-bold text-ink" : "text-muted"}`}
              style={{ left: `${lineX(i)}%` }}
            >
              {d.getDate()}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
