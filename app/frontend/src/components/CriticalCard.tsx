"use client";

import { useState } from "react";

import type { CriticalItem } from "@/lib/types";

import { Icon, Tile, TONES, type Tone } from "./ui";

const SEVERITY: Record<CriticalItem["severity"], { tone: Tone; icon: string }> = {
  late: { tone: "rose", icon: "clock" },
  risk: { tone: "sand", icon: "event" },
  info: { tone: "lav", icon: "review" },
};

// Résumé affiché quand la liste est repliée : nombre d'actions par gravité.
const SUMMARY: { key: CriticalItem["severity"]; tone: Tone; one: string; many: string }[] = [
  { key: "late", tone: "rose", one: "en retard", many: "en retard" },
  { key: "risk", tone: "sand", one: "échéance proche", many: "échéances proches" },
  { key: "info", tone: "lav", one: "à approuver", many: "à approuver" },
];

const STORAGE_KEY = "actions-critiques-repliees";

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
  counts,
  items,
  busy,
  onAction,
}: {
  total: number;
  counts?: Record<CriticalItem["severity"], number>;
  items: CriticalItem[];
  busy: string | null;
  onAction: (item: CriticalItem) => void;
}) {
  // Liste repliable ; le choix est retenu sur l'appareil.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false; // stockage indisponible : liste dépliée
    }
  });
  const toggle = () => {
    setCollapsed(!collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    } catch {
      /* stockage indisponible */
    }
  };

  return (
    <section aria-label="Actions critiques">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold">Actions critiques</h2>
        <span className="flex items-center gap-1.5">
          <span className="chip bg-lime text-ink">{total} à traiter</span>
          {items.length > 0 && (
            <button
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-controls="actions-critiques-liste"
              aria-label={collapsed ? "Déplier les actions critiques" : "Replier les actions critiques"}
              title={collapsed ? "Déplier" : "Replier"}
              className="grid h-7 w-7 place-items-center rounded-full bg-surface text-ink-2 hover:text-ink"
            >
              <Icon name={collapsed ? "caretdown" : "caretup"} className="h-4 w-4" />
            </button>
          )}
        </span>
      </div>
      {collapsed && items.length > 0 && (
        <button onClick={toggle} className="card flex w-full flex-wrap items-center gap-2 text-left hover:bg-surface-2/40">
          {SUMMARY.map((g) => {
            const n = counts ? counts[g.key] : items.filter((i) => i.severity === g.key).length;
            return n > 0 ? (
              <span key={g.key} className={`chip ${TONES[g.tone]}`}>
                {n} {n > 1 ? g.many : g.one}
              </span>
            ) : null;
          })}
          <span className="ml-auto text-[11.5px] font-semibold text-ink-2">Voir tout</span>
        </button>
      )}
      {items.length === 0 && <p className="card text-[12.5px] text-muted">Rien d’urgent : aucun retard ni échéance proche.</p>}
      <ul id="actions-critiques-liste" className={`flex flex-col gap-3 ${collapsed ? "hidden" : ""}`}>
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
