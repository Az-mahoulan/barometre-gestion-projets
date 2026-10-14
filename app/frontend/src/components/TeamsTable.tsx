import type { Dashboard } from "@/lib/types";

import { Avatar, Meter, Section } from "./ui";

export function TeamsTable({ teams }: { teams: Dashboard["teams"] }) {
  const maxLoad = Math.max(1, ...teams.members.map((m) => m.open_tasks));
  return (
    <Section
      title="Équipe"
      aside={`${teams.available} disponible${teams.available > 1 ? "s" : ""} sur ${teams.total}`}
      bodyClassName="overflow-x-auto"
    >
      <table className="data-table min-w-[860px]">
        <thead>
          <tr>
            <th scope="col">Membre</th>
            <th scope="col">Disponibilité</th>
            <th scope="col">Motif</th>
            <th scope="col">Lieu</th>
            <th scope="col">Tâches ouvertes</th>
          </tr>
        </thead>
        <tbody>
          {teams.members.map((m) => (
            <tr key={m.id}>
              <td>
                <span className="flex items-center gap-3">
                  <Avatar initials={m.initials} />
                  <span>
                    <span className="block font-medium">{m.name}</span>
                    <span className="block text-[13px] text-muted">
                      {m.job_title}
                      {m.country ? `, ${m.country}` : ""}
                    </span>
                  </span>
                </span>
              </td>
              <td className={`whitespace-nowrap ${m.status === "available" ? "font-medium text-ok" : "text-ink-2"}`}>{m.status_label}</td>
              <td className="text-ink-2">{m.reason || <span className="text-muted">–</span>}</td>
              <td className="whitespace-nowrap text-ink-2">{m.place_label}</td>
              <td className="w-[230px]">
                <div className="flex items-baseline justify-between text-[13px]">
                  <span>{m.open_tasks}</span>
                  {m.overdue_tasks > 0 && <span className="text-late">dont {m.overdue_tasks} en retard</span>}
                </div>
                <div className="mt-1.5">
                  <Meter value={m.open_tasks / maxLoad} color="#9aa39e" label={`Charge de ${m.name}`} />
                </div>
              </td>
            </tr>
          ))}
          {teams.members.length === 0 && (
            <tr>
              <td colSpan={5} className="text-muted">
                Aucun membre pour ce pays.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Section>
  );
}
