"use client";

import { useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import { projectColor } from "@/lib/projectColors";
import type { GanttProject } from "@/lib/types";

import { ProjectPicker } from "./ProjectPicker";
import { Avatar, CardHeader } from "./ui";

type Milestone = GanttProject["milestones"][number];

/** Part de la période du jalon (du jalon précédent à son échéance) déjà écoulée à la date du jour. */
function expectedAt(m: Milestone, asOf: string) {
  const start = parseDate(m.start).getTime();
  const end = parseDate(m.date).getTime();
  const now = parseDate(asOf).getTime();
  if (end <= start) return now >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

/** Membres du jalon : deux photos, puis le nombre de personnes restantes. */
function Members({ members }: { members: Milestone["members"] }) {
  const shown = members.slice(0, 2);
  const rest = members.length - shown.length;
  const edge = "shadow-[0_0_0_1.5px_var(--surface)]";
  return (
    <span className="flex shrink-0 items-center" title={members.map((u) => u.name).join(", ")}>
      {shown.map((u, i) => (
        <span key={u.name} className={`grid h-7 w-7 shrink-0 rounded-full ${edge} ${i > 0 ? "-ml-2" : ""}`}>
          <Avatar initials={u.initials} seed={u.name} size="h-7 w-7 text-[10px]" />
        </span>
      ))}
      {rest > 0 && (
        <span className={`-ml-2 grid h-7 min-w-7 place-items-center rounded-full bg-surface px-1 text-[10.5px] font-bold text-ink-2 ${edge}`}>
          +{rest}
        </span>
      )}
    </span>
  );
}

/**
 * Progression des jalons : une bande de même longueur par jalon. La partie plus pure montre l'avancement réel
 * (tâches des activités rattachées) ; le trait épais marque l'avancement attendu à date. Tout est écrit dans la bande.
 */
export function MilestoneProgressCard({ projects, asOf }: { projects: GanttProject[]; asOf: string }) {
  const [value, setValue] = useState("");
  const project = projects.find((p) => String(p.id) === value);

  // Un projet : tous ses jalons. Tous les projets : les jalons non atteints des projets en cours, par échéance.
  const rows = project
    ? project.milestones.map((m) => ({ m, p: project }))
    : projects
        .filter((p) => p.status === "active")
        .flatMap((p) => p.milestones.filter((m) => !m.achieved).map((m) => ({ m, p })))
        .sort((a, b) => a.m.date.localeCompare(b.m.date));

  return (
    <section className="card" aria-label="Progression des jalons">
      <CardHeader
        title="Progression des jalons"
        aside={<ProjectPicker projects={projects} value={value} onChange={setValue} label="Jalons du projet" />}
      />

      {rows.length === 0 ? (
        <p className="text-[12.5px] text-muted">Aucun jalon à suivre.</p>
      ) : (
        <ul className="mt-1 flex max-h-[470px] flex-col gap-3 overflow-y-auto py-1 [scrollbar-width:none]">
          {rows.map(({ m, p }) => {
            const c = projectColor(projects, p.id);
            const pct = Math.round(m.progress * 100);
            const expected = expectedAt(m, asOf);
            const behind = !m.achieved && m.progress < expected - 0.05;
            return (
              <li
                key={m.id}
                className="relative h-10 shrink-0 rounded-full"
                style={{ background: `color-mix(in srgb, ${c.bar} 28%, white)` }}
                title={`${p.name} · ${m.name} : ${pct} % réalisé, ${Math.round(expected * 100)} % attendu à date (${m.tasks_complete}/${m.tasks_total} tâches) · échéance ${shortDate(m.date)}`}
              >
                {/* Avancement réel : même teinte, plus pure */}
                {pct > 0 && (
                  <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `max(40px, ${pct}%)`, background: c.bar }} />
                )}
                {/* Avancement attendu à date : petit trait épais */}
                {expected > 0 && expected < 1 && (
                  <span
                    className="absolute inset-y-1 w-[4px] -translate-x-1/2 rounded-full"
                    style={{ left: `${expected * 100}%`, background: c.solid }}
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex h-full items-center gap-2.5 px-1.5">
                  <Members members={m.members} />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">
                    {m.name}
                    {!project && <span className="font-normal text-ink-2"> · {p.name}</span>}
                  </span>
                  <span className="flex shrink-0 items-baseline gap-2 pr-2.5 whitespace-nowrap">
                    <b className={`text-[13px] font-bold ${m.overdue || behind ? "text-late" : "text-ink"}`}>{pct} %</b>
                    <span className={`text-[11px] ${m.overdue ? "font-semibold text-late" : "text-ink-2"}`}>{shortDate(m.date)}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-6 rounded-full bg-[#9cc0ff]" />
          Avancement réel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-3.5 w-[4px] rounded-full bg-[#1e6bff]" />
          Attendu à date
        </span>
        <span>Date : échéance du jalon</span>
      </div>
    </section>
  );
}
