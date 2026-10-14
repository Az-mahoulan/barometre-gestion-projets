import { shortDate } from "@/lib/format";
import type { ProjectRow } from "@/lib/types";

import { HealthChip, HEALTH_BAR, Meter, Section } from "./ui";

// Seuls les écarts sont colorés : une performance normale reste en noir.
function perfClass(v: number) {
  return v >= 90 ? "" : v >= 70 ? "text-risk" : "text-late";
}

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  return (
    <Section title="Projets" aside={`${projects.length} projet${projects.length > 1 ? "s" : ""}`} bodyClassName="overflow-x-auto">
      <table className="data-table min-w-[940px]">
        <thead>
          <tr>
            <th scope="col">Projet</th>
            <th scope="col">Responsable</th>
            <th scope="col">Avancement</th>
            <th scope="col">Jalons</th>
            <th scope="col">
              <abbr className="no-underline" title="Avancement réel divisé par l’avancement attendu à cette date. 100 % : exactement dans le rythme prévu.">
                Performance
              </abbr>
            </th>
            <th scope="col">État</th>
            <th scope="col">Prochain jalon</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <span className="block font-medium">{p.name}</span>
                <span className="block text-[13px] text-muted">
                  {p.country}, {shortDate(p.start)} – {shortDate(p.end)}
                </span>
              </td>
              <td className="whitespace-nowrap">{p.owner}</td>
              <td className="w-[200px]">
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-medium">{Math.round(p.progress * 100)} %</span>
                  <span className="text-muted">
                    {p.tasks_complete} sur {p.tasks_total} tâches
                  </span>
                </div>
                <div className="mt-1.5">
                  <Meter value={p.progress} color={HEALTH_BAR[p.health]} label={`Avancement de ${p.name}`} />
                </div>
              </td>
              <td className="whitespace-nowrap">
                {p.milestones_achieved} sur {p.milestones_total}
              </td>
              <td className={`font-medium ${p.performance === null ? "text-muted" : perfClass(p.performance)}`}>
                {p.performance === null ? "–" : `${p.performance} %`}
              </td>
              <td>
                <HealthChip health={p.health} />
              </td>
              <td>
                {p.next_milestone ? (
                  <>
                    <span className="block">{p.next_milestone.name}</span>
                    <span className={`block text-[13px] ${p.next_milestone.overdue ? "text-late" : "text-muted"}`}>
                      {p.next_milestone.overdue ? "dépassé depuis le " : ""}
                      {shortDate(p.next_milestone.date)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">–</span>
                )}
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={7} className="text-muted">
                Aucun projet pour ces filtres.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Section>
  );
}
