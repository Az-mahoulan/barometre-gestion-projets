"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import { projectColor } from "@/lib/projectColors";
import type { GanttProject } from "@/lib/types";

import { Icon } from "./ui";

const DAY = 86_400_000;
const TODAY_COLOR = "#f26b3a";
// Reste à courir après aujourd'hui : hachures grises, comme sur le modèle.
const HATCH = "repeating-linear-gradient(135deg, #ededE8 0 5px, #f7f7f3 5px 10px)";
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Activités de la semaine : une pilule par activité, à la couleur de son projet.
 * Partie écoulée en couleur pleine, reste hachuré en gris ; trait d'aujourd'hui ; jours en bas.
 */
export function WeekActivitiesCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const today = parseDate(asOf);
  const [offset, setOffset] = useState(0);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const monday = addDays(today, -((today.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const from = iso(monday);
  const to = iso(addDays(monday, 6));
  // Comme sur le modèle, chaque date est une ligne verticale (pas une colonne) : du lundi (0 %) au dimanche (100 %).
  const at = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - monday.getTime()) / (6 * DAY)) * 100));
  const lineX = (i: number) => (i / 6) * 100;
  const nowPct = at(today);
  const todayIn = asOf >= from && asOf <= to;
  const weekPast = today > addDays(monday, 6);

  const items = projects
    .filter((p) => p.status === "active")
    .flatMap((p) => p.activities.filter((a) => a.start <= to && a.end >= from).map((a) => ({ a, p, color: projectColor(projects, p.id) })))
    .sort((x, y) => x.a.start.localeCompare(y.a.start) || x.a.end.localeCompare(y.a.end));

  const go = (o: number) => {
    setOffset(o);
    setMenu(false);
  };

  return (
    <section className="card" aria-label="Activités de la semaine">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[15px] font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink-2">
            <Icon name="timeline" className="h-4 w-4" />
          </span>
          Activités de la semaine
          <span className="text-[12px] font-medium text-muted">
            {shortDate(from)} – {shortDate(to)}
          </span>
        </h2>
        <div ref={menuRef} className="relative">
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-ink-2 hover:bg-[#e9e9e2]"
            onClick={() => setMenu(!menu)}
            aria-haspopup="menu"
            aria-expanded={menu}
            aria-label="Changer de semaine"
          >
            <Icon name="more" className="h-4 w-4" />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-30 w-[190px] rounded-[14px] border border-line bg-surface p-1 shadow-[0_12px_28px_-14px_rgba(28,29,34,0.3)]">
              {[
                [offset - 1, "Semaine précédente"],
                [0, "Cette semaine"],
                [offset + 1, "Semaine suivante"],
              ].map(([o, label]) => (
                <button
                  key={label}
                  role="menuitem"
                  onClick={() => go(o as number)}
                  className={`block w-full rounded-[10px] px-3 py-1.5 text-left text-[12.5px] hover:bg-surface-2 ${label === "Cette semaine" && offset === 0 ? "font-semibold" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-3">
      <div className="relative">
        {/* Une ligne verticale par date */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {days.map((d, i) => (
            <span key={d.getTime()} className="absolute inset-y-0 border-l border-[#ececE6]" style={{ left: `${lineX(i)}%` }} />
          ))}
        </div>

        <ul className="relative flex flex-col gap-2.5 py-3">
          {items.length === 0 && <li className="py-6 text-center text-[12.5px] text-muted">Aucune activité cette semaine.</li>}
          {items.map(({ a, p, color }) => {
            const start = parseDate(a.start);
            const end = parseDate(a.end);
            const cutL = start < monday;
            const cutR = end > addDays(monday, 6);
            // De la ligne du début à celle de la fin ; une activité d'un seul jour garde une petite largeur.
            const single = !cutL && !cutR && a.start === a.end;
            const left = single ? Math.max(0, at(start) - 4) : at(start);
            const right = single ? Math.min(100, at(end) + 4) : at(end);
            // Part écoulée de la barre (jusqu'à aujourd'hui), en % de la barre.
            const done = weekPast ? 100 : todayIn ? Math.min(100, Math.max(0, ((nowPct - left) / Math.max(0.01, right - left)) * 100)) : 0;
            return (
              <li key={a.id} className="relative h-[26px]" title={`${a.name} · ${p.name} · ${shortDate(a.start)} → ${shortDate(a.end)} · ${a.tasks_complete}/${a.tasks_total} tâches`}>
                <div
                  className="absolute inset-y-0 overflow-hidden"
                  style={{
                    left: `${left}%`,
                    width: `${right - left}%`,
                    borderRadius: `${cutL ? 0 : 999}px ${cutR ? 0 : 999}px ${cutR ? 0 : 999}px ${cutL ? 0 : 999}px`,
                    background: HATCH,
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{ width: `${done}%`, background: color.solid }}
                  />
                  <span className={`relative flex h-full items-center gap-1.5 truncate px-3 text-[11.5px] font-medium ${done > 0 ? "text-white" : "text-ink-2"}`}>
                    {/* Activité pas encore commencée : la couleur du projet reste visible par une pastille. */}
                    {done === 0 && <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: color.solid }} />}
                    <span className="truncate">{a.name}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {todayIn && (
          <div className="pointer-events-none absolute -top-2 bottom-0 z-10" style={{ left: `${nowPct}%` }} aria-hidden="true">
            <span className="absolute inset-y-0 w-px -translate-x-1/2" style={{ background: TODAY_COLOR }} />
            <span className="absolute -top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2 bg-surface" style={{ borderColor: TODAY_COLOR }}>
              <span className="absolute inset-[2px] rounded-full" style={{ background: TODAY_COLOR }} />
            </span>
          </div>
        )}
      </div>

      {/* Dates en bas, chacune sous sa ligne */}
      <div className="relative mt-1 h-5 text-[12px]">
        {days.map((d, i) => (
          <span
            key={d.getTime()}
            className={`absolute -translate-x-1/2 ${iso(d) === asOf ? "font-bold text-ink" : "text-muted"}`}
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
