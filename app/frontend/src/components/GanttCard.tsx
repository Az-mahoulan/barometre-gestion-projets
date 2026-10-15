"use client";

import { useEffect, useRef, useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import type { GanttProject } from "@/lib/types";

import { ProjectPicker } from "./ProjectPicker";
import { Icon } from "./ui";

const MONTHS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const NAME_W = 210;
const DAY = 86_400_000;
const ROW_H = 40;

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

/**
 * Jalons menacés : pas encore atteints et dépendant (directement ou en chaîne) d'un jalon en retard.
 * Renvoie, pour chaque jalon en retard, la liste des jalons qu'il menace.
 */
function threats(p: GanttProject) {
  const byId = new Map(p.milestones.map((m) => [m.id, m]));
  const dependents = new Map<number, number[]>();
  for (const m of p.milestones) for (const d of m.depends_on) dependents.set(d, [...(dependents.get(d) ?? []), m.id]);
  const result = new Map<number, Milestone[]>();
  for (const late of p.milestones.filter((m) => m.overdue)) {
    const seen = new Set<number>();
    const stack = [...(dependents.get(late.id) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...(dependents.get(id) ?? []));
    }
    const hit = [...seen].map((id) => byId.get(id)!).filter((m) => m && !m.achieved);
    if (hit.length) result.set(late.id, hit.sort((a, b) => a.date.localeCompare(b.date)));
  }
  return result;
}

interface Row {
  key: string;
  label: string;
  sub: string;
  alert?: string; // vue « Tous les projets » : jalons menacés par un retard
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

  const risks = project ? threats(project) : new Map<number, Milestone[]>();
  const threatened = new Set([...risks.values()].flat().map((m) => m.id));

  const rows: Row[] = project
    ? segments(project).map((s) => ({ key: s.m.name + s.m.date, label: s.m.name, sub: shortDate(s.m.date), segs: [s] }))
    : list.map((p) => {
        const done = p.milestones.filter((m) => m.achieved).length;
        const menaces = new Set([...threats(p).values()].flat().map((m) => m.id)).size;
        return {
          key: String(p.id),
          label: p.name,
          sub: `${done}/${p.milestones.length} jalons`,
          alert: menaces ? `${menaces} menacé${menaces > 1 ? "s" : ""}` : undefined,
          segs: segments(p),
          end: p.end,
          start: p.start,
        };
      });

  // Liaisons de dépendance (vue d'un projet) : tracées en pixels, d'après la largeur réelle de la zone des barres.
  const area = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, top: 0 });
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: Math.max(0, el.clientWidth - NAME_W), top: head.current?.offsetHeight ?? 0 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const links = project
    ? segments(project).flatMap((s, i, all) =>
        s.m.depends_on.flatMap((dep) => {
          const j = all.findIndex((t) => t.m.id === dep);
          if (j < 0) return [];
          const pre = all[j].m;
          const x1 = (pos(pre.date, true) / 100) * box.w;
          const x2 = (pos(s.from) / 100) * box.w;
          const y1 = j * ROW_H + ROW_H / 2;
          const y2 = i * ROW_H + ROW_H / 2;
          const elbow = x2 >= x1 + 4;
          const yTurn = i > j ? i * ROW_H : (i + 1) * ROW_H;
          // Départ sous l'échéance du jalon requis (le bout de la barre porte la date), arrivée au début de la barre.
          const sx = x1 - 3;
          const sy = y1 + 8;
          const d = elbow ? `M${sx} ${sy} V${y2} H${x2 - 1}` : `M${sx} ${sy} V${yTurn} H${x2 - 9} V${y2} H${x2 - 1}`;
          const red = pre.overdue || threatened.has(pre.id);
          return [{ key: `${pre.id}-${s.m.id}`, d, red }];
        }),
      )
    : [];

  return (
    <section className="card" aria-label="Gantt des jalons">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Gantt des jalons</h2>
        <ProjectPicker projects={projects} value={value} onChange={setValue} label="Jalons du projet" />
      </div>

      {/* Retards qui menacent d'autres jalons (dépendances déclarées). */}
      {[...risks.entries()].map(([lateId, hit]) => {
        const late = project?.milestones.find((m) => m.id === lateId);
        return (
          <p key={lateId} className="mb-3 flex items-center gap-2.5 rounded-[12px] bg-late-soft px-3 py-2 text-[12px] text-ink-2" role="status">
            <Icon name="alarm" className="h-4 w-4 shrink-0 text-late" />
            <span>
              Le retard de <b className="text-late">« {late?.name} »</b> menace {hit.length} jalon{hit.length > 1 ? "s" : ""} : {hit.map((m) => m.name).join(", ")}.
            </span>
          </p>
        );
      })}

      <div ref={area} className="relative overflow-clip rounded-[14px] border border-line bg-[#f7f7f3]">
        <div ref={head} className="relative z-20 grid border-b border-[#d6d6ce] bg-[#ebebe5]" style={{ gridTemplateColumns: `${NAME_W}px minmax(0,1fr)` }}>
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
              <span className="shrink-0 text-right text-[10.5px] leading-tight text-muted">
                {r.sub}
                {project && threatened.has(r.segs[0]?.m.id) && <b className="block font-semibold text-late">menacé</b>}
                {r.alert && <b className="block font-semibold text-late">{r.alert}</b>}
              </span>
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
                      style={{
                        left: `calc(${left}% + ${i > 0 ? 1.5 : 0}px)`,
                        width: `calc(${Math.max(0.4, right - left)}% - ${i > 0 ? 1.5 : 0}px)`,
                        background: st.bar,
                        // Jalon menacé par un retard en amont : contour en pointillé rouge.
                        outline: threatened.has(s.m.id) ? "1.5px dashed #c7321f" : undefined,
                        outlineOffset: 2,
                      }}
                      title={`${s.m.name} · ${shortDate(s.m.date)} · ${threatened.has(s.m.id) ? "menacé par un retard" : st.label}`}
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
                    {/* Vue d'un projet : la date au bout de la barre (au bout du retard s'il y en a un). */}
                    {project && <DateTag at={s.m.overdue ? Math.max(right, todayLeft) : right} date={s.m.date} late={s.m.overdue ? Math.round((parseDate(asOf).getTime() - parseDate(s.m.date).getTime()) / DAY) : 0} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {links.length > 0 && box.w > 0 && (
          <svg
            className="pointer-events-none absolute z-[5] overflow-visible"
            style={{ left: NAME_W, top: box.top, width: box.w, height: rows.length * ROW_H }}
            aria-hidden="true"
          >
            <defs>
              {(["#8a8f98", "#c7321f"] as const).map((c) => (
                <marker key={c} id={`dep-${c.slice(1)}`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill={c} />
                </marker>
              ))}
            </defs>
            {links.map((l) => (
              <path
                key={l.key}
                d={l.d}
                fill="none"
                stroke={l.red ? "#c7321f" : "#8a8f98"}
                strokeWidth="1.5"
                strokeLinejoin="round"
                markerEnd={`url(#dep-${l.red ? "c7321f" : "8a8f98"})`}
              />
            ))}
          </svg>
        )}

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
        {project && (
          <>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden="true">
            <path d="M1 1 H6 V6 H14" fill="none" stroke="#8a8f98" strokeWidth="1.5" />
            <path d="M13 3.5 L17 6 L13 8.5 Z" fill="#8a8f98" />
          </svg>
          Dépendance
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-4 rounded-[1px] bg-[#a9c4f2] outline-[1.5px] outline-offset-1 outline-dashed outline-[#c7321f]" />
          Menacé
        </span>
          </>
        )}
      </div>
    </section>
  );
}

/** Date d'échéance écrite au bout de la barre ; à l'intérieur, juste avant l'échéance, si elle sortirait du tableau. */
function DateTag({ at, date, late }: { at: number; date: string; late: number }) {
  const text = late ? `${shortDate(date)} · ${late} j de retard` : shortDate(date);
  const before = at > (late ? 70 : 86);
  return (
    <span
      className={`absolute top-[13px] whitespace-nowrap text-[10.5px] font-medium leading-[14px] ${late ? "text-late" : before ? "text-ink-2" : "text-muted"}`}
      style={before ? { right: `calc(${100 - at}% + 9px)` } : { left: `calc(${at}% + 6px)` }}
    >
      {text}
    </span>
  );
}
