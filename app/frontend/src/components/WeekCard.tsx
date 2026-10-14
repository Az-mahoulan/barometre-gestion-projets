"use client";

import { useState } from "react";

import { dayLabel, parseDate, shortDate } from "@/lib/format";
import type { Week, WeekItem } from "@/lib/types";

import { CardHeader } from "./ui";

const BAR: Record<WeekItem["kind"], string> = {
  event: "var(--accent-2)",
  milestone: "var(--bar-risk)",
  task: "var(--ink)",
};

export function WeekCard({ week, onOffset }: { week: Week; onOffset: (offset: number) => void }) {
  const todayDay = week.days.find((d) => d.is_today);
  const [picked, setPicked] = useState<string | null>(null);
  const selectedDate = week.days.some((d) => d.date === picked) ? picked : (todayDay?.date ?? week.days[0].date);
  const selected = week.days.find((d) => d.date === selectedDate) ?? week.days[0];

  return (
    <section className="card" aria-label="Programmation">
      <CardHeader
        title="Programmation"
        aside={
          <span className="flex items-center gap-1.5">
            <button className="rounded-md border border-line-strong px-2 py-0.5" onClick={() => onOffset(week.offset - 1)} aria-label="Semaine précédente">
              ‹
            </button>
            {shortDate(week.start)} – {shortDate(week.end)}
            <button className="rounded-md border border-line-strong px-2 py-0.5" onClick={() => onOffset(week.offset + 1)} aria-label="Semaine suivante">
              ›
            </button>
            {week.offset !== 0 && (
              <button className="btn btn-sm" onClick={() => onOffset(0)}>
                Aujourd’hui
              </button>
            )}
          </span>
        }
      />

      <div className="mb-2 flex justify-between" role="tablist" aria-label="Jours de la semaine">
        {week.days.map((d) => {
          const active = d.date === selected.date;
          return (
            <button
              key={d.date}
              role="tab"
              aria-selected={active}
              onClick={() => setPicked(d.date)}
              className={`flex w-10 flex-col items-center gap-0.5 rounded-[10px] py-1.5 text-[11.5px] ${
                active ? "bg-accent text-[#cfe8d9]" : "text-muted"
              }`}
            >
              <span>{dayLabel(d.date)}</span>
              <b className={`text-[15px] font-semibold ${active ? "text-white" : "text-ink"}`}>{parseDate(d.date).getDate()}</b>
              <i className={`h-1 w-1 rounded-full ${d.items.length ? (active ? "bg-white" : "bg-accent-2") : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col">
        {selected.items.length === 0 && <li className="border-t border-[#f1f3f5] py-4 text-sm text-muted">Rien de prévu ce jour.</li>}
        {selected.items.map((item, i) => (
          <li key={`${item.kind}-${i}`} className="flex gap-3 border-t border-[#f1f3f5] py-2.5">
            <i className="w-[3px] shrink-0 rounded-sm" style={{ background: item.late ? "var(--bar-late)" : BAR[item.kind] }} />
            <div className="min-w-0 flex-1">
              <b className={`block text-[13.5px] font-medium leading-snug ${item.done ? "text-muted line-through" : ""}`}>{item.title}</b>
              <small className="text-xs text-muted">
                {item.time ? `${item.time} · ` : ""}
                {item.subtitle}
                {item.late ? " · en retard" : ""}
              </small>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
