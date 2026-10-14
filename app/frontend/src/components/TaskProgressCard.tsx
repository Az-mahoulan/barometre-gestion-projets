import type { Dashboard, GanttProject } from "@/lib/types";

import { CardHeader, DuoIcon } from "./ui";

// Une tuile par statut : libellé et icône Solar dans la couleur du statut, nombre de tâches en grand.
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

      <ul className="mt-2 grid flex-1 grid-cols-3 gap-2.5 sm:grid-cols-5">
        {progress.statuses.map((s) => {
          return (
            <li
              key={s.key}
              className="flex min-h-[150px] flex-col items-center justify-center gap-4 rounded-xl border border-line px-2 py-4 text-center"
              aria-label={`${s.label} : ${s.count} tâche${s.count > 1 ? "s" : ""}`}
            >
              <span className="text-[12.5px] font-semibold leading-tight" style={{ color: STATUS_COLOR[s.key] }}>
                {s.label}
              </span>
              <span style={{ color: STATUS_COLOR[s.key] }}>
                <DuoIcon name={s.key} className="h-11 w-11" />
              </span>
              <span>
                <b className="block text-[30px] font-semibold leading-none tracking-[-0.5px]">{s.count}</b>
                <span className="mt-1 block text-[11.5px] text-muted">{s.pct} %</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[12.5px] text-muted">
        {progress.total} tâche{progress.total > 1 ? "s" : ""} au total
        {progress.overdue > 0 && <span className="text-late"> · {progress.overdue} en retard</span>}
      </p>
    </section>
  );
}
