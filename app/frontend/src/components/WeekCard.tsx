"use client";

import { useState } from "react";

import { dayLabel, parseDate, shortDate } from "@/lib/format";
import type { Week, WeekItem } from "@/lib/types";

import { CardHeader, Icon, Tile, type Tone } from "./ui";

const KIND: Record<WeekItem["kind"], { icon: string; tone: Tone; label: string }> = {
  event: { icon: "users", tone: "peach", label: "Réunion" },
  milestone: { icon: "flag", tone: "lav", label: "Jalon" },
  task: { icon: "factcheck", tone: "mint", label: "Tâche" },
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
          <span className="flex items-center gap-1.5 font-semibold text-ink-2">
            <button className="grid h-7 w-7 place-items-center rounded-[9px] border border-line" onClick={() => onOffset(week.offset - 1)} aria-label="Semaine précédente">
              <Icon name="left" className="h-[18px] w-[18px]" />
            </button>
            {shortDate(week.start)} – {shortDate(week.end)}
            <button className="grid h-7 w-7 place-items-center rounded-[9px] border border-line" onClick={() => onOffset(week.offset + 1)} aria-label="Semaine suivante">
              <Icon name="right" className="h-[18px] w-[18px]" />
            </button>
          </span>
        }
      />

      <div className="mb-2 grid grid-cols-7 gap-1" role="tablist" aria-label="Jours de la semaine">
        {week.days.map((d) => {
          const active = d.date === selected.date;
          return (
            <button
              key={d.date}
              role="tab"
              aria-selected={active}
              onClick={() => setPicked(d.date)}
              className={`flex flex-col items-center rounded-[14px] py-1.5 text-[11px] ${active ? "bg-side text-white" : "text-muted hover:bg-surface-2"}`}
            >
              <span>{dayLabel(d.date)}</span>
              <b className={`text-[14px] font-bold ${active ? "text-lime" : d.is_today ? "text-ink underline decoration-lime decoration-[3px] underline-offset-4" : "text-ink"}`}>
                {parseDate(d.date).getDate()}
              </b>
              <i className={`mt-0.5 h-1 w-1 rounded-full ${d.items.length ? (active ? "bg-lime" : "bg-ink-2") : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <ul>
        {selected.items.length === 0 && <li className="py-4 text-[12.5px] text-muted">Rien de prévu ce jour.</li>}
        {selected.items.map((item, i) => {
          const k = KIND[item.kind];
          return (
            <li key={`${item.kind}-${i}`} className="flex items-center gap-3 py-2.5">
              <Tile icon={item.late ? "clock" : k.icon} tone={item.late ? "rose" : k.tone} />
              <div className="min-w-0 flex-1">
                <b className={`block truncate text-[13px] font-bold ${item.done ? "text-muted line-through" : ""}`}>{item.title}</b>
                <small className="block truncate text-[11.5px] text-muted">
                  {[item.time, item.subtitle].filter(Boolean).join(" · ")}
                  {item.late && <span className="text-late"> · en retard</span>}
                </small>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
