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
    <section className="flex flex-col gap-3.5 rounded-2xl border border-[#dfe9e2] bg-surface px-[22px] py-[18px]" aria-label="Assistant IA">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-ink text-white">
          <Icon name="sparkle" />
        </span>
        <div className="min-w-[260px] flex-1">
          <div className="text-[12.5px] font-medium text-muted">Assistant IA · Synthèse du jour</div>
          <p className="mt-1 max-w-[760px] text-[14.5px] leading-normal">{summary}</p>
        </div>
        {canRemind && reminders > 0 && (
          <button className="btn btn-dark" onClick={onRemind}>
            Relancer les responsables ({reminders})
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 py-1.5 pl-4 pr-1.5 text-[13.5px] text-muted">
        <input
          disabled
          aria-label="Question ou instruction pour l’assistant"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
          placeholder="Assistant conversationnel (« Crée une tâche pour Koffi », « Qui est disponible demain ? ») : prochaine étape"
        />
        <span className="hidden text-xs sm:inline">Rien n’est modifié sans votre confirmation</span>
        <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-ink text-white opacity-40">
          <Icon name="send" />
        </span>
      </div>
    </section>
  );
}
