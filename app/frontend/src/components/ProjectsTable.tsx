import { shortDate } from "@/lib/format";
import type { ProjectRow } from "@/lib/types";

import { Avatar, HealthChip, HEALTH_BAR, Meter } from "./ui";

function perfClass(v: number) {
  return v >= 90 ? "text-ok" : v >= 70 ? "text-risk" : "text-late";
}

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  return (
    <section className="card !p-0 overflow-hidden" aria-label="Vue d’ensemble des projets">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <h2 className="text-base font-semibold">Vue d’ensemble des projets</h2>
        <span className="text-[12.5px] text-muted">{projects.length} projets · performance = avancement réel ÷ avancement attendu</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-surface-2 text-left text-[12.5px] font-medium text-muted">
              {["Projet", "Responsable", "Avancement", "Jalons", "Performance", "État", "Prochain jalon"].map((h) => (
                <th key={h} scope="col" className="border-t border-line px-3.5 py-2.5 font-medium first:pl-5 last:pr-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-[#f1f3f5]">
                <td className="py-3 pl-5 pr-3.5">
                  <b className="font-medium">{p.name}</b>
                  <small className="block text-xs text-muted">
                    {p.country} · {shortDate(p.start)} → {shortDate(p.end)} · {p.activities} activités
                  </small>
                </td>
                <td className="px-3.5">
                  <span className="flex items-center gap-2.5">
                    <Avatar initials={p.owner_initials} />
                    {p.owner.split(" ")[0]}
                  </span>
                </td>
                <td className="w-[190px] px-3.5">
                  <Meter value={p.progress} color={HEALTH_BAR[p.health]} />
                  <small className="mt-1 block text-xs text-muted">
                    {Math.round(p.progress * 100)} % · {p.tasks_complete}/{p.tasks_total} tâches
                  </small>
                </td>
                <td className="px-3.5 font-medium">
                  {p.milestones_achieved}/{p.milestones_total}
                </td>
                <td className={`px-3.5 font-semibold ${p.performance === null ? "text-muted" : perfClass(p.performance)}`}>
                  {p.performance === null ? "—" : `${p.performance} %`}
                </td>
                <td className="px-3.5">
                  <HealthChip health={p.health} />
                </td>
                <td className="py-3 pl-3.5 pr-5">
                  {p.next_milestone ? (
                    <>
                      {p.next_milestone.name}
                      <small className={`block text-xs ${p.next_milestone.overdue ? "text-late" : "text-muted"}`}>
                        {p.next_milestone.overdue ? "dépassé · " : ""}
                        {shortDate(p.next_milestone.date)}
                      </small>
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-muted">
                  Aucun projet pour ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
