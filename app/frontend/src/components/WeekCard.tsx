"use client";

import { useState } from "react";

import { dayLabel, parseDate, shortDate } from "@/lib/format";
import type { Week, WeekItem } from "@/lib/types";

import { Icon } from "./ui";

// Couleur par type d'élément ; un élément en retard passe en rouge.
const KIND: Record<WeekItem["kind"], { color: string; label: string }> = {
  event: { color: "var(--info)", label: "Réunion" },
  milestone: { color: "#e8901c", label: "Jalon" },
  task: { color: "var(--accent-2)", label: "Tâche" },
};
const colorOf = (item: WeekItem) => (item.late ? "var(--bar-late)" : KIND[item.kind].color);

export function WeekCard({ week, onOffset }: { week: Week; onOffset: (offset: number) => void }) {
  const todayDay = week.days.find((d) => d.is_today);
  const [picked, setPicked] = useState<string | null>(null);
  const selectedDate = week.days.some((d) => d.date === picked) ? picked : (todayDay?.date ?? week.days[0].date);
  const selected = week.days.find((d) => d.date === selectedDate) ?? week.days[0];

  return (
    <section className="card" aria-label="Programmation">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold">{week.offset === 0 ? "Cette semaine" : "Programmation"}</h2>
        <span className="flex items-center gap-1 text-[12px] font-semibold text-ink-2">
          <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface-2" onClick={() => onOffset(week.offset - 1)} aria-label="Semaine précédente">
            <Icon name="left" className="h-4 w-4" />
          </button>
          {shortDate(week.start)} – {shortDate(week.end)}
          <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface-2" onClick={() => onOffset(week.offset + 1)} aria-label="Semaine suivante">
            <Icon name="right" className="h-4 w-4" />
          </button>
        </span>
      </div>

      <div className="grid grid-cols-7 border-b border-line pb-3" role="tablist" aria-label="Jours de la semaine">
        {week.days.map((d) => {
          const active = d.date === selected.date;
          const colors = [...new Set(d.items.map(colorOf))].slice(0, 3);
          return (
            <button key={d.date} role="tab" aria-selected={active} onClick={() => setPicked(d.date)} className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] ${d.is_today ? "font-bold text-ink" : "text-muted"}`}>{dayLabel(d.date)}</span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold ${
                  active ? "bg-side text-white" : d.is_today ? "text-ink ring-2 ring-lime" : "text-ink hover:bg-surface-2"
                }`}
              >
                {parseDate(d.date).getDate()}
              </span>
              <span className="flex h-1.5 gap-[3px]">
                {colors.map((c) => (
                  <i key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-1">
        {selected.items.length === 0 && <li className="py-4 text-[12.5px] text-muted">Rien de prévu ce jour.</li>}
        {selected.items.map((item, i) => (
          <li key={`${item.kind}-${i}`} className="flex items-start gap-3 border-b border-line py-2.5 last:border-b-0">
            <i className="mt-[5px] h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(item) }} />
            <div className="min-w-0 flex-1">
              <b className={`block truncate text-[13px] font-semibold ${item.done ? "text-muted line-through" : ""}`}>{item.title}</b>
              <small className="block truncate text-[11.5px] text-muted">
                {[item.time, item.subtitle].filter(Boolean).join(" · ")}
                {item.late && <span className="text-late"> · en retard</span>}
              </small>
            </div>
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-semibold text-ink-2">{KIND[item.kind].label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-muted">
        {(Object.keys(KIND) as WeekItem["kind"][]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full" style={{ background: KIND[k].color }} />
            {KIND[k].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <i className="h-1.5 w-1.5 rounded-full bg-[var(--bar-late)]" />
          En retard
        </span>
      </div>
    </section>
  );
}
