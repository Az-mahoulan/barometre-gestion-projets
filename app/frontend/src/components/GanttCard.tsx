"use client";

import { useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

import { ProjectPicker } from "./ProjectPicker";

const MONTHS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const NAME_W = 210;
const DAY = 86_400_000;

// Statut d'un jalon : atteint, à venir ou dépassé.
const STATUS = {
  done: { bar: "#8fd6b0", solid: "#1f7a4d", label: "Atteint" },
  todo: { bar: "#a9c4f2", solid: "#2a56c6", label: "À venir" },
  late: { bar: "#f2a397", solid: "#c7321f", label: "Dépassé" },
} as const;
type Status = keyof typeof STATUS;

type Milestone = GanttProject["milestones"][number];
const statusOf = (m: Milestone): Status => (m.achieved ? "done" : m.overdue ? "late" : "todo");

/** Segments d'un projet : du début (ou du jalon précédent) jusqu'à chaque jalon. */
function segments(p: GanttProject) {
  const ms = [...p.milestones].sort((a, b) => a.date.localeCompare(b.date));
  return ms.map((m, i) => ({ m, from: i === 0 ? p.start : ms[i - 1].date, to: m.date }));
}

interface Row {
  key: string;
  label: string;
  sub: string;
  segs: ReturnType<typeof segments>;
  start?: string; // vue « Tous les projets » : début et fin du projet
  end?: string;
}

/** Gantt des jalons : tous les projets en cours (une ligne par projet) ou un projet (une ligne par jalon). */
export function GanttCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const [value, setValue] = useState("");
  const project = projects.find((p) => String(p.id) === value);
  const list = project ? [project] : projects.filter((p) => p.status === "active");

  // Période affichée : du premier début à la dernière échéance (et jusqu'à aujourd'hui si un jalon est en retard).
  const starts = list.map((p) => p.start);
  const ends = list.flatMap((p) => [p.end, ...p.milestones.map((m) => m.date), ...(p.milestones.some((m) => m.overdue) ? [asOf] : [])]);
  const first = starts.length ? parseDate(starts.sort()[0]) : parseDate(asOf);
  const last = ends.length ? parseDate(ends.sort().at(-1)!) : parseDate(asOf);
  const from = new Date(first.getFullYear(), first.getMonth(), 1);
  const to = new Date(last.getFullYear(), last.getMonth() + 1, 1);
  const span = to.getTime() - from.getTime();
  const pos = (iso: string, endOfDay = false) => ((parseDate(iso).getTime() + (endOfDay ? DAY : 0) - from.getTime()) / span) * 100;

  const months: Date[] = [];
  for (let m = new Date(from); m < to; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) months.push(m);
  const monthLeft = (m: Date) => ((m.getTime() - from.getTime()) / span) * 100;
  const todayLeft = pos(asOf) + (DAY / span) * 50;
  const showToday = parseDate(asOf) >= from && parseDate(asOf) < to;

  const rows: Row[] = project
    ? segments(project).map((s) => ({ key: s.m.name + s.m.date, label: s.m.name, sub: shortDate(s.m.date), segs: [s] }))
    : list.map((p) => {
        const done = p.milestones.filter((m) => m.achieved).length;
        return { key: String(p.id), label: p.name, sub: `${done}/${p.milestones.length} jalons`, segs: segments(p), end: p.end, start: p.start };
      });

  return (
    <section className="card" aria-label="Gantt des jalons">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Gantt des jalons</h2>
        <ProjectPicker projects={projects} value={value} onChange={setValue} label="Jalons du projet" />
      </div>

      <div className="relative overflow-clip rounded-[14px] border border-line bg-[#f7f7f3]">
        <div className="relative z-20 grid border-b border-[#d6d6ce] bg-[#ebebe5]" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
          <div className="flex items-center px-4 py-2.5 text-[12px] font-semibold">{project ? "Jalons" : "Projets"}</div>
          <div className="relative">
            {months.map((m) => (
              <span
                key={m.getTime()}
                className="absolute inset-y-0 flex items-center border-l border-[#d6d6ce] pl-2 text-[11.5px] font-semibold text-ink-2"
                style={{ left: `${monthLeft(m)}%` }}
              >
                {MONTHS[m.getMonth()]}
              </span>
            ))}
          </div>
        </div>

        {rows.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucun jalon à afficher.</p>}
        {rows.map((r) => (
          <div key={r.key} className="grid border-b border-line last:border-b-0" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
            <div className="flex min-w-0 items-center justify-between gap-2 px-4">
              <span className="truncate text-[12px] font-medium text-ink-2" title={r.label}>
                {r.label}
              </span>
              <span className="shrink-0 text-[10.5px] text-muted">{r.sub}</span>
            </div>
            <div className="relative h-[40px]">
              <div className="absolute inset-0" aria-hidden="true">
                {months.map((m) => (
                  <span key={m.getTime()} className="absolute inset-y-0 border-l border-line" style={{ left: `${monthLeft(m)}%` }} />
                ))}
              </div>

              {/* Fin de projet au-delà du dernier jalon (vue « Tous les projets »). */}
              {r.end && r.segs.length > 0 && r.end > r.segs.at(-1)!.to && (
                <span
                  className="absolute top-[12px] h-[16px] rounded-[2px] bg-[#e4e4dd]"
                  style={{ left: `${pos(r.segs.at(-1)!.to, true)}%`, width: `${pos(r.end, true) - pos(r.segs.at(-1)!.to, true)}%` }}
                  title={`Fin du projet · ${shortDate(r.end)}`}
                />
              )}
              {r.end && r.start && r.segs.length === 0 && (
                <span
                  className="absolute top-[12px] h-[16px] rounded-[2px] bg-[#e4e4dd]"
                  style={{ left: `${pos(r.start)}%`, width: `${pos(r.end, true) - pos(r.start)}%` }}
                  title="Aucun jalon"
                />
              )}

              {r.segs.map((s, i) => {
                const st = STATUS[statusOf(s.m)];
                const left = pos(s.from, i > 0);
                const right = pos(s.to, true);
                return (
                  <div key={s.m.name + s.m.date}>
                    <span
                      className="absolute top-[12px] h-[16px] rounded-[2px]"
                      style={{ left: `calc(${left}% + ${i > 0 ? 1.5 : 0}px)`, width: `calc(${Math.max(0.4, right - left)}% - ${i > 0 ? 1.5 : 0}px)`, background: st.bar }}
                      title={`${s.m.name} · ${shortDate(s.m.date)} · ${st.label}`}
                    />
                    {/* Échéance : portion de couleur franche au bout de la barre. */}
                    <span className="absolute top-[12px] h-[16px] w-[5px] rounded-[2px]" style={{ left: `calc(${right}% - 5px)`, background: st.solid }} />
                    {/* Retard : pointillé de l'échéance jusqu'à aujourd'hui. */}
                    {s.m.overdue && (
                      <span
                        className="absolute top-[19px] h-0 border-t-2 border-dashed"
                        style={{ left: `${right}%`, width: `${Math.max(0, todayLeft - right)}%`, borderColor: st.solid }}
                        title={`${Math.round((parseDate(asOf).getTime() - parseDate(s.m.date).getTime()) / DAY)} j de retard`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {showToday && rows.length > 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 z-10"
            style={{ left: `calc(${NAME_W}px + (100% - ${NAME_W}px) * ${todayLeft / 100})` }}
            aria-hidden="true"
          >
            <span className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-lime" />
            <span className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-lime px-1.5 text-[9.5px] font-bold text-ink">
              Aujourd’hui · {shortDate(asOf)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {(Object.keys(STATUS) as Status[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <i className="h-2 w-5 rounded-[1px]" style={{ background: STATUS[k].bar, boxShadow: `inset -3px 0 0 ${STATUS[k].solid}` }} />
            Jalon {STATUS[k].label.toLowerCase()}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <i className="w-4 border-t-2 border-dashed border-[#c7321f]" />
          Retard
        </span>
      </div>
    </section>
  );
}
