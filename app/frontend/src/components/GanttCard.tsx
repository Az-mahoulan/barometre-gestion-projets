"use client";

import { useMemo, useState } from "react";

import { monthShort, parseDate, shortDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

import { HEALTH_BAR, Section } from "./ui";

function firstOfMonth(d: Date, offset = 0) {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}

interface Row {
  key: string | number;
  label: string;
  sub?: string;
  subLate?: boolean;
  start: Date;
  end: Date;
  progress: number;
  color: string;
  muted?: boolean;
  tip: string;
}

export function GanttCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const [tab, setTab] = useState<"projects" | "detail">("projects");
  const [selected, setSelected] = useState<number | null>(null);
  const today = parseDate(asOf);

  const active = projects.filter((p) => p.status === "active");
  const current = projects.find((p) => p.id === selected) ?? active[0] ?? projects[0];

  const { rows, from, to } = useMemo(() => {
    const list: Row[] =
      tab === "projects"
        ? projects.map((p) => ({
            key: p.id,
            label: p.name,
            sub: p.next_milestone
              ? p.next_milestone.overdue
                ? `Jalon dépassé le ${shortDate(p.next_milestone.date)}`
                : `${p.next_milestone.name}, ${shortDate(p.next_milestone.date)}`
              : p.status === "active"
                ? "Tous les jalons sont atteints"
                : "Achevé",
            subLate: p.next_milestone?.overdue,
            start: parseDate(p.start),
            end: parseDate(p.end),
            progress: p.progress,
            color: HEALTH_BAR[p.health],
            muted: p.status !== "active",
            tip: `${p.name}, du ${shortDate(p.start)} au ${shortDate(p.end)}, ${Math.round(p.progress * 100)} % réalisé`,
          }))
        : (current?.activities ?? []).map((a) => ({
            key: a.id,
            label: a.name,
            sub: `${a.tasks_complete}/${a.tasks_total} tâches`,
            start: parseDate(a.start),
            end: parseDate(a.end),
            progress: a.progress,
            color: current ? HEALTH_BAR[current.health] : "var(--bar-ok)",
            tip: `${a.name}, du ${shortDate(a.start)} au ${shortDate(a.end)}`,
          }));
    const pool = tab === "projects" ? list.filter((r) => !r.muted) : list;
    const base = pool.length ? pool : list;
    if (!base.length) return { rows: list, from: firstOfMonth(today), to: firstOfMonth(today, 5) };
    const min = new Date(Math.min(...base.map((r) => r.start.getTime())));
    const max = new Date(Math.max(...base.map((r) => r.end.getTime())));
    const a = firstOfMonth(min);
    const b = firstOfMonth(max, 1);
    return { rows: list.filter((r) => r.end >= a && r.start < b), from: a, to: b };
  }, [tab, projects, current, today]);

  const span = to.getTime() - from.getTime();
  const pos = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - from.getTime()) / span) * 100));
  const months: Date[] = [];
  for (let m = new Date(from); m < to; m = firstOfMonth(m, 1)) months.push(m);
  const todayPos = today >= from && today < to ? pos(today) : null;
  const ownTodayLine = todayPos !== null;

  return (
    <Section
      title="Gantt des projets"
      bodyClassName="px-5 pb-4 pt-3"
      aside={
          <div className="flex rounded-lg bg-[#eceeed] p-0.5 text-[13px]" role="group" aria-label="Vue">
            {(
              [
                ["projects", "Projets"],
                ["detail", "Par activité"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
                className={`rounded-md px-3 py-1 ${tab === key ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--line)]" : "text-ink-2"}`}
              >
                {label}
              </button>
            ))}
          </div>
      }
    >

      {tab === "detail" && (
        <div className="mb-2 mt-1">
          <label className="sr-only" htmlFor="gantt-project">
            Projet
          </label>
          <select id="gantt-project" className="field" value={current?.id} onChange={(e) => setSelected(Number(e.target.value))}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="py-6 text-muted">Aucun projet pour ces filtres.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className={`relative min-w-[640px] ${ownTodayLine ? "pb-6" : ""}`}>
            <div className="flex h-8 items-center text-[12px] text-muted">
              <div className="w-[210px] shrink-0" />
              <div className="relative h-8 flex-1">
                {months.map((m) => (
                  <span key={m.getTime()} className="absolute top-2 border-l border-line-soft pl-1.5" style={{ left: `${pos(m)}%` }}>
                    {monthShort(m)}
                  </span>
                ))}
              </div>
            </div>

            {rows.map((r) => (
              <div key={r.key} className="flex h-[50px] items-center border-t border-line-soft">
                <div className="w-[210px] shrink-0 overflow-hidden whitespace-nowrap pr-3">
                  <span className={`block truncate ${r.muted ? "text-muted" : ""}`}>{r.label}</span>
                  {r.sub && <span className={`block truncate text-[12px] ${r.subLate ? "text-late" : "text-muted"}`}>{r.sub}</span>}
                </div>
                <div className="relative h-[50px] flex-1">
                  <div
                    title={r.tip}
                    className="absolute top-[22px] h-1.5 overflow-hidden rounded-[2px]"
                    style={{
                      left: `${pos(r.start)}%`,
                      width: `${Math.max(1, pos(r.end) - pos(r.start))}%`,
                      background: "var(--track)",
                    }}
                  >
                    <div className="h-full" style={{ width: `${r.progress * 100}%`, background: r.color }} />
                  </div>
                </div>
              </div>
            ))}

            {ownTodayLine && (
              <div className="pointer-events-none absolute bottom-6 top-7" style={{ left: 210, right: 0 }}>
                <div className="absolute bottom-0 top-0 border-l border-ink/70" style={{ left: `${todayPos}%` }} />
                <span
                  className="absolute -bottom-6 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 text-[12px] font-medium leading-[18px] text-white"
                  style={{ left: `${todayPos}%` }}
                >
                  Aujourd’hui, {today.getDate()} {monthShort(today)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-line-soft pt-3 text-[12px] text-muted">
        {(
          [
            ["Dans les temps", "var(--bar-ok)"],
            ["À surveiller", "var(--bar-risk)"],
            ["En retard", "var(--bar-late)"],
          ] as const
        ).map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <i className="inline-block h-1.5 w-3.5 rounded-[2px]" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="ml-auto">Barre pleine : part du travail réalisée</span>
      </div>
    </Section>
  );
}
