import type { Dashboard, Member } from "@/lib/types";

import { Avatar, Meter } from "./ui";

const STATUS_CLASS: Record<Member["status"], string> = {
  available: "bg-ok-soft text-ok",
  meeting: "bg-info-soft text-info",
  mission: "bg-info-soft text-info",
  training: "bg-info-soft text-info",
  leave: "bg-[#eef1f4] text-ink-2",
};

export function TeamsTable({ teams }: { teams: Dashboard["teams"] }) {
  const maxLoad = Math.max(1, ...teams.members.map((m) => m.open_tasks));
  return (
    <section className="card !p-0 overflow-hidden" aria-label="Vue d’ensemble des équipes">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <h2 className="text-base font-semibold">Vue d’ensemble des équipes</h2>
        <span className="text-[12.5px] text-muted">
          {teams.available} disponible{teams.available > 1 ? "s" : ""} sur {teams.total}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-surface-2 text-left text-[12.5px] font-medium text-muted">
              {["Membre", "Disponibilité", "Raison", "Lieu", "Charge"].map((h) => (
                <th key={h} scope="col" className="border-t border-line px-3.5 py-2.5 font-medium first:pl-5 last:pr-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.members.map((m) => (
              <tr key={m.id} className="border-t border-[#f1f3f5]">
                <td className="py-2.5 pl-5 pr-3.5">
                  <span className="flex items-center gap-2.5">
                    <Avatar initials={m.initials} tone={m.status === "available" ? "green" : "gray"} />
                    <span>
                      <b className="block font-medium">{m.name}</b>
                      <small className="text-xs text-muted">
                        {m.job_title}
                        {m.country ? ` · ${m.country}` : ""}
                      </small>
                    </span>
                  </span>
                </td>
                <td className="px-3.5">
                  <span className={`chip ${STATUS_CLASS[m.status]}`}>{m.status_label}</span>
                </td>
                <td className="px-3.5">{m.reason || <span className="text-muted">—</span>}</td>
                <td className="px-3.5">{m.place_label}</td>
                <td className="py-2.5 pl-3.5 pr-5">
                  <span className="flex items-center gap-2.5 text-[12.5px] text-muted">
                    <span className="max-w-[140px] flex-1">
                      <Meter value={m.open_tasks / maxLoad} />
                    </span>
                    {m.open_tasks} tâche{m.open_tasks > 1 ? "s" : ""}
                    {m.overdue_tasks > 0 && <span className="text-late">· {m.overdue_tasks} en retard</span>}
                  </span>
                </td>
              </tr>
            ))}
            {teams.members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-muted">
                  Aucun membre pour ce pays.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
