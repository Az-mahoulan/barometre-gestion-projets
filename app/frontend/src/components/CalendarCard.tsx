"use client";

import { useState } from "react";

import { parseDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

import { Icon } from "./ui";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Calendrier du mois : aujourd'hui en vert-citron, un point sous les jours qui portent un jalon (rouge s'il est dépassé). */
export function CalendarCard({ asOf, projects }: { asOf: string; projects: GanttProject[] }) {
  const today = parseDate(asOf);
  const [offset, setOffset] = useState(0);
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));

  const marks = new Map<string, { names: string[]; late: boolean }>();
  for (const p of projects) {
    for (const m of p.milestones) {
      if (m.achieved) continue;
      const cur = marks.get(m.date) ?? { names: [], late: false };
      cur.names.push(`${m.name} (${p.name})`);
      cur.late = cur.late || m.overdue;
      marks.set(m.date, cur);
    }
  }

  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const weeks = [0, 1, 2, 3, 4, 5].map((w) => days.slice(w * 7, w * 7 + 7)).filter((w) => w.some((d) => d.getMonth() === first.getMonth()));

  return (
    <section className="card" aria-label="Calendrier des jalons">
      <div className="mb-3 flex items-center justify-between font-bold">
        <button className="grid h-7 w-7 place-items-center rounded-[9px] border border-line" onClick={() => setOffset(offset - 1)} aria-label="Mois précédent">
          <Icon name="left" className="h-[18px] w-[18px]" />
        </button>
        {MONTHS[first.getMonth()]} {first.getFullYear()}
        <button className="grid h-7 w-7 place-items-center rounded-[9px] border border-line" onClick={() => setOffset(offset + 1)} aria-label="Mois suivant">
          <Icon name="right" className="h-[18px] w-[18px]" />
        </button>
      </div>
      <table className="w-full border-separate border-spacing-y-1 text-center text-[11.5px]">
        <thead>
          <tr className="bg-surface-2 text-ink-2">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <th key={i} scope="col" className="py-[7px] font-semibold first:rounded-l-[10px] last:rounded-r-[10px]">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={iso(w[0])}>
              {w.map((d) => {
                const key = iso(d);
                const mark = marks.get(key);
                const isToday = key === asOf;
                const out = d.getMonth() !== first.getMonth();
                return (
                  <td key={key} className={`relative py-0.5 ${out ? "text-[#c4c6cc]" : "text-ink-2"}`} title={mark?.names.join("\n")}>
                    <span className={`inline-grid h-6 w-6 place-items-center rounded-full ${isToday ? "bg-lime font-bold text-ink" : ""}`}>{d.getDate()}</span>
                    {mark && !out && (
                      <i className={`absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${mark.late ? "bg-late" : "bg-info"}`} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex gap-4 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-1.5 w-1.5 rounded-full bg-info" />
          Jalon prévu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-1.5 w-1.5 rounded-full bg-late" />
          Jalon dépassé
        </span>
      </div>
    </section>
  );
}
