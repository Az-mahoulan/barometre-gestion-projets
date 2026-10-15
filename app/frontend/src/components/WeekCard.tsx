"use client";

import { useState } from "react";

import { parseDate } from "@/lib/format";
import type { GanttProject, Week, WeekItem } from "@/lib/types";

import { Avatar, Icon } from "./ui";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const mondayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));

// Trois couleurs seulement : réunion (bleu), échéance (orange), retard (rouge).
const COLORS = { meeting: "var(--info)", deadline: "var(--bar-risk)", late: "var(--bar-late)" } as const;
type Tint = keyof typeof COLORS;
const LEGEND: { tint: Tint; label: string }[] = [
  { tint: "meeting", label: "Réunion" },
  { tint: "deadline", label: "Échéance" },
  { tint: "late", label: "En retard" },
];
const tintOf = (item: WeekItem): Tint => (item.kind === "event" ? "meeting" : item.late ? "late" : "deadline");
const KIND_LABEL: Record<WeekItem["kind"], string> = {
  event: "",
  project: "Projet",
  activity: "Activité",
  milestone: "Jalon",
  task: "Tâche",
};

/** Calendrier du mois (semaine affichée mise en évidence) puis les réunions et échéances du jour choisi. */
export function WeekCard({
  week,
  asOf,
  projects,
  onOffset,
}: {
  week: Week;
  asOf: string;
  projects: GanttProject[];
  onOffset: (offset: number) => void;
}) {
  const today = parseDate(asOf);
  const [monthOffset, setMonthOffset] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const todayDay = week.days.find((d) => d.is_today);
  const selectedDate = week.days.some((d) => d.date === picked) ? picked : (todayDay?.date ?? week.days[0].date);
  const selected = week.days.find((d) => d.date === selectedDate) ?? week.days[0];

  // Points sous les jours : détail exact pour la semaine chargée, jalons et fins de projet pour le reste du mois.
  const marks = new Map<string, Set<Tint>>();
  const mark = (date: string, tint: Tint) => marks.set(date, (marks.get(date) ?? new Set<Tint>()).add(tint));
  for (const p of projects) {
    for (const m of p.milestones) if (!m.achieved) mark(m.date, m.overdue ? "late" : "deadline");
    if (p.status === "active") mark(p.end, p.end < asOf ? "late" : "deadline");
  }
  for (const d of week.days) {
    marks.delete(d.date);
    for (const item of d.items) mark(d.date, tintOf(item));
  }

  const first = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const start = mondayOf(first);
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const rows = [0, 1, 2, 3, 4, 5].map((w) => days.slice(w * 7, w * 7 + 7)).filter((w) => w.some((d) => d.getMonth() === first.getMonth()));

  const pick = (d: Date) => {
    const offset = Math.round((mondayOf(d).getTime() - mondayOf(today).getTime()) / (7 * 86_400_000));
    setPicked(iso(d));
    if (offset !== week.offset) onOffset(offset);
  };

  const selectedLabel = parseDate(selected.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="card flex flex-col" aria-label="Programmation">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">Programmation</h2>
        <span className="flex items-center gap-1 text-[12.5px] font-semibold">
          <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface-2" onClick={() => setMonthOffset(monthOffset - 1)} aria-label="Mois précédent">
            <Icon name="left" className="h-4 w-4" />
          </button>
          <span className="min-w-[104px] text-center">
            {MONTHS[first.getMonth()]} {first.getFullYear()}
          </span>
          <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface-2" onClick={() => setMonthOffset(monthOffset + 1)} aria-label="Mois suivant">
            <Icon name="right" className="h-4 w-4" />
          </button>
        </span>
      </div>

      <table className="w-full border-separate border-spacing-y-[3px] text-center text-[11.5px]">
        <thead>
          <tr className="text-muted">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <th key={i} scope="col" className="pb-1 font-semibold">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((w) => {
            const shown = iso(w[0]) === week.start;
            return (
              <tr key={iso(w[0])}>
                {w.map((d) => {
                  const key = iso(d);
                  const out = d.getMonth() !== first.getMonth();
                  const active = shown && key === selected.date;
                  const tints = [...(marks.get(key) ?? [])];
                  return (
                    <td key={key} className={`p-0 ${shown ? "bg-lime/35 first:rounded-l-full last:rounded-r-full" : ""}`}>
                      <button
                        onClick={() => pick(d)}
                        aria-pressed={active}
                        aria-label={parseDate(key).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                        className={`relative mx-auto grid h-7 w-7 place-items-center rounded-full ${
                          active
                            ? "bg-side font-bold text-white"
                            : key === asOf
                              ? "bg-lime font-bold text-ink"
                              : out
                                ? "text-[#c4c6cc] hover:bg-surface-2"
                                : `hover:bg-surface-2 ${shown ? "font-semibold text-ink" : "text-ink-2"}`
                        }`}
                      >
                        {d.getDate()}
                        {tints.length > 0 && (
                          <span className="absolute -bottom-[1px] left-1/2 flex -translate-x-1/2 gap-[2px]">
                            {LEGEND.filter((l) => tints.includes(l.tint)).map((l) => (
                              <i key={l.tint} className="h-1 w-1 rounded-full" style={{ background: COLORS[l.tint] }} />
                            ))}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <b className="text-[13px] font-semibold first-letter:uppercase">{selectedLabel}</b>
        <span className="text-[11.5px] text-muted">
          {selected.items.length} élément{selected.items.length > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="mb-3 mt-1">
        {selected.items.length === 0 && <li className="py-4 text-[12.5px] text-muted">Rien de prévu ce jour.</li>}
        {selected.items.map((item, i) => {
          const people = item.people ?? [];
          return (
            <li key={`${item.kind}-${i}`} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
              <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[tintOf(item)] }} />
              <div className="min-w-0 flex-1">
                <b className={`block truncate text-[12.5px] font-semibold ${item.done ? "text-muted line-through" : ""}`}>{item.title}</b>
                <small className="block truncate text-[11px] text-muted">
                  {[item.time, KIND_LABEL[item.kind], item.subtitle].filter(Boolean).join(" · ")}
                  {item.late && <span className="text-late"> · en retard</span>}
                </small>
              </div>
              {people.length > 0 && (
                <span className="flex shrink-0 items-center pl-1" title={people.map((p) => p.name).join(", ")}>
                  {people.slice(0, 3).map((p) => (
                    <span key={p.initials + p.name} className="-ml-1 rounded-full ring-2 ring-surface">
                      <Avatar initials={p.initials} size="h-7 w-7 text-[9.5px]" />
                    </span>
                  ))}
                  {people.length > 3 && (
                    <span className="-ml-1 grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-[9.5px] font-bold ring-2 ring-surface">
                      +{people.length - 3}
                    </span>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[11px] text-muted">
        {LEGEND.map((l) => (
          <span key={l.tint} className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: COLORS[l.tint] }} />
            {l.label}
          </span>
        ))}
      </div>
    </section>
  );
}
