"use client";

import { useState } from "react";

import { dayLabel, parseDate, shortDate } from "@/lib/format";
import type { Week } from "@/lib/types";

import { Icon, Section } from "./ui";

export function WeekCard({ week, onOffset }: { week: Week; onOffset: (offset: number) => void }) {
  const todayDay = week.days.find((d) => d.is_today);
  const [picked, setPicked] = useState<string | null>(null);
  const selectedDate = week.days.some((d) => d.date === picked) ? picked : (todayDay?.date ?? week.days[0].date);
  const selected = week.days.find((d) => d.date === selectedDate) ?? week.days[0];

  return (
    <Section
      title="Cette semaine"
      bodyClassName="px-4 pb-2 pt-3"
      aside={
        <span className="flex items-center gap-1">
          {week.offset !== 0 && (
            <button className="mr-1 text-[13px] font-medium text-accent-2 hover:underline" onClick={() => onOffset(0)}>
              Aujourd’hui
            </button>
          )}
          <button className="rounded-md p-1 text-ink-2 hover:bg-[#e9ecea]" onClick={() => onOffset(week.offset - 1)} aria-label="Semaine précédente">
            <Icon name="left" />
          </button>
          <span className="min-w-[96px] text-center text-ink-2">
            {shortDate(week.start)} – {shortDate(week.end)}
          </span>
          <button className="rounded-md p-1 text-ink-2 hover:bg-[#e9ecea]" onClick={() => onOffset(week.offset + 1)} aria-label="Semaine suivante">
            <Icon name="right" />
          </button>
        </span>
      }
    >
      <div className="grid grid-cols-7 border-b border-line-soft" role="tablist" aria-label="Jours de la semaine">
        {week.days.map((d) => {
          const active = d.date === selected.date;
          return (
            <button
              key={d.date}
              role="tab"
              aria-selected={active}
              onClick={() => setPicked(d.date)}
              className={`-mb-px flex flex-col items-center border-b-2 pb-2 pt-1 text-[12px] ${
                active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <span>{dayLabel(d.date)}</span>
              <span className={`text-[16px] ${d.is_today ? "font-semibold text-accent" : active ? "font-medium" : ""}`}>{parseDate(d.date).getDate()}</span>
              <span
                className={`mt-1 h-1 w-1 rounded-full ${d.items.length ? "bg-ink-2" : "bg-transparent"}`}
                aria-label={d.items.length ? `${d.items.length} élément${d.items.length > 1 ? "s" : ""} prévu${d.items.length > 1 ? "s" : ""}` : undefined}
              />
            </button>
          );
        })}
      </div>

      <ul>
        {selected.items.length === 0 && <li className="py-4 text-muted">Rien de prévu ce jour.</li>}
        {selected.items.map((item, i) => (
          <li key={`${item.kind}-${i}`} className="flex gap-3 border-t border-line-soft py-2.5 first:border-t-0">
            <span className="w-11 shrink-0 text-[13px] text-muted">{item.time ?? ""}</span>
            <div className="min-w-0 flex-1">
              <span className={`block font-medium leading-snug ${item.done ? "text-muted line-through" : ""}`}>{item.title}</span>
              <span className="text-[13px] text-muted">
                {item.subtitle}
                {item.late && <span className="text-late">, en retard</span>}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
