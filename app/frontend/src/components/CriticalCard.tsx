"use client";

import type { CriticalItem } from "@/lib/types";

import { Tile, TONES, type Tone } from "./ui";

const SEVERITY: Record<CriticalItem["severity"], { tone: Tone; icon: string }> = {
  late: { tone: "rose", icon: "clock" },
  risk: { tone: "sand", icon: "event" },
  info: { tone: "lav", icon: "review" },
};

const ACTION_LABEL: Record<NonNullable<CriticalItem["action"]>, string> = {
  remind: "Relancer",
  approve: "Approuver",
  reschedule: "Replanifier",
};

/** Le sous-titre serveur (« Projet · Personne · 5 jours de retard ») est découpé en contexte + échéance courte. */
function split(subtitle: string) {
  const parts = subtitle.split(" · ");
  const due = parts.pop() ?? "";
  const short = due
    .replace(/^(\d+) jours? de retard$/, "$1 j de retard")
    .replace(/^échéance aujourd'hui$/, "Aujourd’hui")
    .replace(/^échéance demain$/, "Demain")
    .replace(/^échéance dans (\d+) jours$/, "Dans $1 jours")
    .replace(/^en revue, à approuver$/, "À approuver");
  return { context: parts.join(" · "), due: short };
}

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
    <section aria-label="Actions critiques">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">Actions critiques</h2>
        <span className="chip bg-lime text-ink">{total} à traiter</span>
      </div>
      {items.length === 0 && <p className="card text-[12.5px] text-muted">Rien d’urgent : aucun retard ni échéance proche.</p>}
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const sev = item.kind === "milestone_overdue" ? { tone: "rose" as Tone, icon: "flag" } : SEVERITY[item.severity];
          const key = `${item.kind}-${item.task_id ?? item.project_id}-${item.title}`;
          const { context, due } = split(item.subtitle);
          return (
            <li key={key} className="flex gap-3 rounded-[18px] bg-surface p-3.5">
              <Tile icon={sev.icon} tone={sev.tone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <b className="text-[13px] font-bold leading-snug">{item.title}</b>
                  <span className={`chip shrink-0 ${TONES[sev.tone]}`}>{due}</span>
                </div>
                <small className="block truncate text-[11.5px] text-muted">{context}</small>
                {item.action && (
                  <button
                    className="btn btn-sm mt-2"
                    disabled={busy === key || item.action === "reschedule"}
                    title={item.action === "reschedule" ? "La replanification arrive à l’étape suivante" : undefined}
                    onClick={() => onAction(item)}
                  >
                    {ACTION_LABEL[item.action]}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
