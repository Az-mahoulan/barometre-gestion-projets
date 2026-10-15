"use client";

import type { Dashboard } from "@/lib/types";

import { Icon } from "./ui";

/** Synthèse du jour, construite à partir des chiffres du tableau de bord (aucune donnée inventée). */
export function buildSummary(d: Dashboard): string {
  const { late_projects } = d.kpis;
  const overdue = d.kpis.overdue_tasks;
  if (late_projects === 0 && overdue === 0) {
    return "Aucun projet en retard et aucune tâche en dépassement d’échéance. Les prochaines échéances sont dans « Programmation ».";
  }
  const parts: string[] = [];
  if (late_projects > 0) parts.push(`${late_projects} projet${late_projects > 1 ? "s sont" : " est"} en retard`);
  if (overdue > 0) parts.push(`${overdue} tâche${overdue > 1 ? "s ont" : " a"} dépassé leur échéance`);
  let text = `${parts.join(" et ")}.`;

  const unavailable = d.teams.members
    .filter((m) => m.status !== "available" && m.overdue_tasks > 0)
    .sort((a, b) => b.overdue_tasks - a.overdue_tasks)[0];
  if (unavailable) {
    text += ` ${unavailable.name}, ${unavailable.status_label.toLowerCase()}${unavailable.reason ? ` (${unavailable.reason.replace(/\.$/, "")})` : ""}, porte ${unavailable.overdue_tasks} de ces retards.`;
  }
  return text;
}

// Met en valeur les quantités (« 2 projets », « 4 tâches ») de la synthèse.
function highlight(text: string) {
  return text.split(/(\d+ (?:projets?|tâches?))/).map((part, i) =>
    i % 2 ? (
      <em key={i} className="not-italic text-lime">
        {part}
      </em>
    ) : (
      part
    ),
  );
}

export function AssistantCard({
  summary,
  canRemind,
  reminders,
  onRemind,
}: {
  summary: string;
  canRemind: boolean;
  reminders: number;
  onRemind: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-side p-[22px] text-white" aria-label="Synthèse de l’assistant">
      <i className="pointer-events-none absolute -right-10 -top-10 h-[150px] w-[150px] rounded-full border-[22px] border-lime/10" />
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#c9cad0]">
        <span className="text-lime">
          <Icon name="sparkle" className="h-[18px] w-[18px]" />
        </span>
        Synthèse de l’assistant
      </div>
      <p className="relative my-3.5 text-[17px] font-bold leading-[1.4]">{highlight(summary)}</p>
      {canRemind && reminders > 0 && (
        <button className="btn btn-lime" onClick={onRemind}>
          <Icon name="campaign" className="h-[18px] w-[18px]" />
          Relancer les responsables ({reminders})
        </button>
      )}
      <div className="mt-4 flex items-center gap-2 rounded-full bg-side-2 py-[7px] pl-4 pr-[7px] text-[12.5px] text-[#9b9da5]">
        <input
          disabled
          aria-label="Question pour l’assistant"
          placeholder="Posez une question à l’assistant (bientôt)"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9b9da5]"
        />
        <span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-ink opacity-60">
          <Icon name="up" className="h-[18px] w-[18px]" />
        </span>
      </div>
    </section>
  );
}
