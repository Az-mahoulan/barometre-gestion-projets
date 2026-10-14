"use client";

import type { CriticalItem } from "@/lib/types";

import { CardHeader, Icon } from "./ui";

const TONE: Record<CriticalItem["severity"], { box: string; icon: string }> = {
  late: { box: "bg-late-soft text-late", icon: "clock" },
  risk: { box: "bg-risk-soft text-risk", icon: "calendar" },
  info: { box: "bg-ok-soft text-ok", icon: "check" },
};

const ACTION_LABEL: Record<NonNullable<CriticalItem["action"]>, string> = {
  remind: "Relancer",
  approve: "Approuver",
  reschedule: "Replanifier",
};

export function CriticalCard({
  total,
  items,
  busy,
  onAction,
}: {
  total: number;
  items: CriticalItem[];
  busy: string | null;
  onAction: (item: CriticalItem) => void;
}) {
  return (
    <section className="card" aria-label="Actions critiques">
      <CardHeader title="Actions critiques" aside={`${total} à traiter`} />
      {items.length === 0 && <p className="py-4 text-sm text-muted">Rien d’urgent : aucun retard ni échéance proche.</p>}
      <ul>
        {items.map((item) => {
          const tone = item.severity === "late" && item.kind === "milestone_overdue" ? { ...TONE.late, icon: "flag" } : TONE[item.severity];
          const key = `${item.kind}-${item.task_id ?? item.project_id}-${item.title}`;
          return (
            <li key={key} className="grid grid-cols-[34px_1fr_auto] items-center gap-3 border-t border-[#f1f3f5] py-2.5 first:border-t-0">
              <span className={`grid h-[34px] w-[34px] place-items-center rounded-[10px] ${tone.box}`}>
                <Icon name={tone.icon} />
              </span>
              <div className="min-w-0">
                <b className="block truncate text-[13.5px] font-medium">{item.title}</b>
                <small className="text-xs text-muted">{item.subtitle}</small>
              </div>
              {item.action && (
                <button
                  className="btn btn-sm"
                  disabled={busy === key || item.action === "reschedule"}
                  title={item.action === "reschedule" ? "La replanification arrive à l’étape suivante" : undefined}
                  onClick={() => onAction(item)}
                >
                  {ACTION_LABEL[item.action]}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">Retards et échéances des 3 prochains jours. Toutes les échéances sont dans « Programmation ».</p>
    </section>
  );
}
