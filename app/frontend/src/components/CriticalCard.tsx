"use client";

import type { CriticalItem } from "@/lib/types";

import { Section } from "./ui";

const DUE_CLASS: Record<CriticalItem["severity"], string> = {
  late: "text-late",
  risk: "text-risk",
  info: "text-muted",
};

const ACTION_LABEL = { remind: "Relancer", approve: "Approuver" } as const;

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
    <Section
      title="À traiter"
      bodyClassName="px-5 py-1"
      aside={total > items.length ? `${items.length} sur ${total}, les plus urgentes d’abord` : undefined}
    >
      {items.length === 0 && <p className="py-5 text-muted">Aucun retard ni échéance dans les 3 prochains jours.</p>}
      <ul>
        {items.map((item) => {
          const key = `${item.kind}-${item.task_id ?? item.project_id}-${item.title}`;
          const action = item.action === "remind" || item.action === "approve" ? item.action : null;
          return (
            <li key={key} className="flex items-center gap-4 border-t border-line-soft py-3 first:border-t-0">
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.title}</span>
                <span className="block truncate text-[13px] text-muted">
                  {item.project}
                  {item.person ? `, ${item.person}` : ""}
                </span>
              </div>
              <span className={`shrink-0 text-right text-[13px] ${DUE_CLASS[item.severity]}`}>{item.due_text}</span>
              <span className="w-[92px] shrink-0 text-right">
                {action && (
                  <button className="btn btn-sm" disabled={busy === key} onClick={() => onAction(item)}>
                    {ACTION_LABEL[action]}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
