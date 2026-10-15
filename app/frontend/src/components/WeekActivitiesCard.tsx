"use client";

import { useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import { projectColor } from "@/lib/projectColors";
import type { GanttProject } from "@/lib/types";

import { Icon } from "./ui";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY = 86_400_000;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Activités de la semaine : une barre par activité en cours cette semaine, à la couleur de son projet.
 * Partie déjà écoulée en couleur pleine, reste de l'activité hachuré ; trait d'aujourd'hui.
 */
export function WeekActivitiesCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const today = parseDate(asOf);
  const [offset, setOffset] = useState(0);
  const monday = addDays(today, -((today.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const from = iso(monday);
  const to = iso(addDays(monday, 6));
  const span = 7 * DAY;
  // Position d'un instant dans la semaine (en %), bornée à la semaine.
  const at = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - monday.getTime()) / span) * 100));
  const nowPct = at(new Date(today.getTime() + DAY / 2));
  const todayIn = asOf >= from && asOf <= to;

  const items = projects
    .filter((p) => p.status === "active")
    .flatMap((p) => p.activities.filter((a) => a.start <= to && a.end >= from).map((a) => ({ a, p, color: projectColor(projects, p.id) })))
    .sort((x, y) => x.a.start.localeCompare(y.a.start) || x.a.end.localeCompare(y.a.end));

  return (
    <section className="card" aria-label="Activités de la semaine">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Activités de la semaine</h2>
        <span className="flex items-center rounded-full border border-line">
          <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" onClick={() => setOffset(offset - 1)} aria-label="Semaine précédente">
            <Icon name="left" className="h-4 w-4" />
          </button>
          <button className="min-w-[118px] px-1 text-center text-[12.5px] font-semibold" onClick={() => setOffset(0)} title="Revenir à cette semaine">
            {shortDate(from)} – {shortDate(to)}
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" onClick={() => setOffset(offset + 1)} aria-label="Semaine suivante">
            <Icon name="right" className="h-4 w-4" />
          </button>
        </span>
      </div>

      <div className="relative">
        {/* Colonnes des jours (week-end grisé) */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-7" aria-hidden="true">
          {days.map((d, i) => (
            <div key={i} className={`border-l border-dashed border-line first:border-l-0 ${i >= 5 ? "bg-surface-2/60" : ""}`} />
          ))}
        </div>

        <ul className="relative flex flex-col gap-2.5 py-2">
          {items.length === 0 && <li className="py-6 text-center text-[12.5px] text-muted">Aucune activité cette semaine.</li>}
          {items.map(({ a, p, color }) => {
            const start = parseDate(a.start);
            const end = addDays(parseDate(a.end), 1);
            const left = at(start);
            const right = at(end);
            const cutL = start < monday;
            const cutR = end > addDays(monday, 7);
            // Part écoulée de la barre (jusqu'à aujourd'hui), en % de la barre.
            const done = todayIn || today >= addDays(monday, 7) ? Math.min(100, Math.max(0, ((nowPct - left) / Math.max(0.01, right - left)) * 100)) : 0;
            const future = done < 30;
            return (
              <li key={a.id} className="relative h-[30px]" title={`${a.name} · ${p.name} · ${shortDate(a.start)} → ${shortDate(a.end)} · ${a.tasks_complete}/${a.tasks_total} tâches`}>
                <div
                  className="absolute inset-y-0 overflow-hidden"
                  style={{
                    left: `calc(${left}% + ${cutL ? 0 : 3}px)`,
                    width: `calc(${right - left}% - ${(cutL ? 0 : 3) + (cutR ? 0 : 3)}px)`,
                    borderRadius: `${cutL ? 0 : 999}px ${cutR ? 0 : 999}px ${cutR ? 0 : 999}px ${cutL ? 0 : 999}px`,
                    background: `repeating-linear-gradient(135deg, ${color.bar}66 0 6px, ${color.bar}cc 6px 12px)`,
                  }}
                >
                  <div className="absolute inset-y-0 left-0" style={{ width: `${done}%`, background: color.solid }} />
                  <span className={`relative flex h-full items-center gap-1.5 truncate px-3 text-[11.5px] font-semibold ${future ? "text-ink" : "text-white [text-shadow:0_1px_2px_rgba(28,29,34,0.35)]"}`}>
                    <span className="truncate">{a.name}</span>
                    <span className={`shrink-0 font-medium ${future ? "text-ink-2" : "text-white/75"}`}>· {p.name}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {todayIn && (
          <div className="pointer-events-none absolute -top-1 bottom-0 z-10" style={{ left: `${nowPct}%` }} aria-hidden="true">
            <span className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-lime" />
            <span className="absolute -top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-surface bg-lime" />
          </div>
        )}
      </div>

      {/* Jours en bas, comme sur le modèle */}
      <div className="mt-1 grid grid-cols-7 border-t border-line pt-2 text-center">
        {days.map((d, i) => {
          const isToday = iso(d) === asOf;
          return (
            <div key={i} className="flex flex-col items-center">
              <span className={`text-[12.5px] font-semibold ${isToday ? "grid h-6 min-w-6 place-items-center rounded-full bg-lime px-1 text-ink" : "text-ink-2"}`}>{d.getDate()}</span>
              <span className="text-[10.5px] text-muted">{DAYS[i]}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
