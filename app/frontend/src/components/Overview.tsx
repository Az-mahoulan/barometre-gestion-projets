"use client";

import { longDate } from "@/lib/format";
import type { Dashboard } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  todo: "var(--s-todo)",
  doing: "var(--s-doing)",
  done: "var(--s-done)",
  review: "var(--s-review)",
  approved: "var(--s-approved)",
};

/** Synthèse du jour, construite à partir des chiffres du tableau de bord (aucune donnée inventée). */
export function buildSummary(d: Dashboard): string {
  const { late_projects } = d.kpis;
  const overdue = d.task_progress.overdue;
  if (late_projects === 0 && overdue === 0) {
    return "Aucun projet en retard et aucune tâche en dépassement d’échéance.";
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

function Stat({ label, value, note, alert }: { label: string; value: string | number; note: string; alert?: boolean }) {
  return (
    <div className="py-4 md:px-5 md:first:pl-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={`mt-1 text-[28px] font-semibold leading-none tracking-[-0.5px] ${alert ? "text-late" : ""}`}>{value}</dd>
      <dd className="mt-2 text-[13px] text-ink-2">{note}</dd>
    </div>
  );
}

export function Overview({
  data,
  reminders,
  onRemind,
}: {
  data: Dashboard;
  reminders: number;
  onRemind: () => void;
}) {
  const k = data.kpis;
  const tp = data.task_progress;
  const total = Math.max(tp.total, 1);

  return (
    <section className="panel px-6 pb-5 pt-6" aria-label="Synthèse">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-[64ch]">
          <p className="text-[20px] font-medium leading-[1.4] tracking-[-0.2px]">{buildSummary(data)}</p>
          <p className="mt-2 text-[13px] text-muted">Synthèse de l’assistant, établie à partir des données du {longDate(data.as_of)}.</p>
        </div>
        {reminders > 0 && (
          <button className="btn btn-primary" onClick={onRemind}>
            Relancer les responsables ({reminders})
          </button>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 divide-line border-t border-line md:grid-cols-4 md:gap-x-0 md:divide-x">
        <Stat label="Projets en cours" value={k.active_projects} note={k.at_risk_projects ? `dont ${k.at_risk_projects} à surveiller` : "aucun à surveiller"} />
        <Stat
          label="Projets en retard"
          value={k.late_projects}
          alert={k.late_projects > 0}
          note={k.late_milestones ? `${k.late_milestones} jalon${k.late_milestones > 1 ? "s" : ""} dépassé${k.late_milestones > 1 ? "s" : ""}` : "aucun jalon dépassé"}
        />
        <Stat label="Projets achevés" value={k.completed_projects} note="sur la période" />
        <Stat label="Jalons atteints" value={`${k.milestones_pct} %`} note={`${k.milestones_achieved} sur ${k.milestones_total}`} />
      </dl>

      <div className="border-t border-line pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-medium">Avancement des {tp.total} tâches</h3>
          {tp.overdue > 0 && (
            <span className="text-[13px] text-late">
              {tp.overdue} en retard
            </span>
          )}
        </div>
        <div className="mt-2.5 flex h-2.5 gap-[2px] overflow-hidden rounded-[3px]" role="img" aria-label={tp.statuses.map((s) => `${s.label} : ${s.count}`).join(", ")}>
          {tp.statuses
            .filter((s) => s.count > 0)
            .map((s) => (
              <span key={s.key} style={{ width: `${(s.count / total) * 100}%`, background: STATUS_COLOR[s.key] }} title={`${s.label} : ${s.count}`} />
            ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-ink-2">
          {tp.statuses.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: STATUS_COLOR[s.key] }} />
              {s.label}
              <span className="font-medium text-ink">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
