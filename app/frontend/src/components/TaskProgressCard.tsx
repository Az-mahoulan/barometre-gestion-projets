import type { Dashboard, GanttProject } from "@/lib/types";

import { CardHeader, TileIcon } from "./ui";

// Couleur de chaque statut : libellé, icône et part dans la barre de répartition.
// Fond pastel de chaque tuile.
const STATUS_BG: Record<string, string> = {
  todo: "#f3f3ee",
  doing: "#dcecfd",
  done: "#d9f1ec",
  review: "#fdf0cf",
  approved: "#e3f6cf",
};

const STATUS_COLOR: Record<string, string> = {
  todo: "#6b7280",
  doing: "#2a56c6",
  done: "#0f766e",
  review: "#d97706",
  approved: "#1f7a4d",
};

export function TaskProgressCard({
  progress,
  projects,
  value,
  onChange,
}: {
  progress: Dashboard["task_progress"];
  projects: GanttProject[];
  value: string;
  onChange: (id: string) => void;
}) {
  const total = Math.max(progress.total, 1);
  // Tâches terminées : faites, en revue ou approuvées (même règle que l'avancement des projets côté serveur).
  const FINISHED = ["done", "review", "approved"];
  const finished = progress.statuses.filter((s) => FINISHED.includes(s.key)).reduce((sum, s) => sum + s.count, 0);
  const finishedPct = Math.round((finished / total) * 100);

  return (
    <section className="card flex flex-col" aria-label="Progression des tâches">
      <CardHeader
        title="Progression des tâches"
        aside={
          <>
            <label className="sr-only" htmlFor="tasks-project">
              Projet
            </label>
            <select id="tasks-project" className="field max-w-[210px] !py-1.5" value={value} onChange={(e) => onChange(e.target.value)}>
              <option value="">Tous les projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </>
        }
      />

      <ul className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {progress.statuses.map((s) => (
          <li
            key={s.key}
            className="flex flex-col items-center gap-2.5 rounded-[18px] px-2 py-3.5 text-center"
            style={{ background: STATUS_BG[s.key] }}
            aria-label={`${s.label} : ${s.count} tâche${s.count > 1 ? "s" : ""}`}
          >
            <span className="text-[12.5px] font-semibold leading-tight" style={{ color: STATUS_COLOR[s.key] }}>
              {s.label}
            </span>
            <span style={{ color: STATUS_COLOR[s.key] }}>
              <TileIcon name={s.key} className="h-9 w-9" />
            </span>
            <b className="text-[24px] font-extrabold leading-none tracking-[-0.5px]">{s.count}</b>
          </li>
        ))}
      </ul>

      {/* Barre de flux : la part de chaque statut, de « En attente » à « Approuvé », sur une seule ligne. */}
      <div className="flex flex-1 flex-col justify-center pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium text-ink-2">Répartition des {progress.total} tâches</span>
          <span className="text-[13px] text-muted">
            <b className="text-[20px] font-semibold text-ink">{finishedPct} %</b> terminées
          </span>
        </div>
        <div
          className="mt-3 flex h-3.5 w-full gap-[3px] overflow-hidden rounded-full"
          role="img"
          aria-label={`Répartition des ${progress.total} tâches : ${progress.statuses.map((s) => `${s.label} ${s.pct} %`).join(", ")}`}
        >
          {progress.statuses
            .filter((s) => s.count > 0)
            .map((s) => (
              <span
                key={s.key}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(s.count / total) * 100}%`, background: STATUS_COLOR[s.key] }}
                title={`${s.label} : ${s.count} (${s.pct} %)`}
              />
            ))}
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2.5 text-center text-[12px] sm:grid-cols-5">
          {progress.statuses.map((s) => (
            <li key={s.key}>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
                <i className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_COLOR[s.key] }} />
                {s.label}
              </span>
              <b className="mt-0.5 block text-[15px] font-semibold">{s.pct} %</b>
            </li>
          ))}
        </ul>
        {progress.overdue > 0 && (
          <p className="mt-4 rounded-full bg-late-soft px-4 py-2 text-[12.5px] font-semibold text-late">
            {progress.overdue} tâche{progress.overdue > 1 ? "s" : ""} en retard sur leur échéance
          </p>
        )}
      </div>
    </section>
  );
}
