import type { Dashboard, GanttProject } from "@/lib/types";

import { CardHeader, TileIcon } from "./ui";

// Couleur de chaque statut : libellé, icône et part du demi-anneau.
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
  // Demi-anneau : les statuts occupent la moitié supérieure d'un cercle en dégradé conique.
  const total = Math.max(progress.total, 1);
  const stops = progress.statuses
    .filter((s) => s.count > 0)
    .map((s, i, all) => {
      const from = all.slice(0, i).reduce((sum, x) => sum + x.count, 0);
      return `${STATUS_COLOR[s.key]} ${(from / total) * 50}% ${((from + s.count) / total) * 50}%`;
    });
  const gradient = `conic-gradient(from -90deg, ${stops.join(", ") || "#e6ebe8 0% 50%"}, transparent 50% 100%)`;

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
            className="flex flex-col items-center gap-2.5 rounded-xl border border-line px-2 py-3 text-center"
            aria-label={`${s.label} : ${s.count} tâche${s.count > 1 ? "s" : ""}`}
          >
            <span className="text-[12.5px] font-semibold leading-tight" style={{ color: STATUS_COLOR[s.key] }}>
              {s.label}
            </span>
            <span style={{ color: STATUS_COLOR[s.key] }}>
              <TileIcon name={s.key} className="h-9 w-9" />
            </span>
            <b className="text-[24px] font-semibold leading-none tracking-[-0.5px]">{s.count}</b>
          </li>
        ))}
      </ul>

      <div className="flex flex-1 flex-col items-center justify-center pt-5">
        <div
          className="relative h-[122px] w-[240px] overflow-hidden"
          role="img"
          aria-label={`Répartition des ${progress.total} tâches : ${progress.statuses.map((s) => `${s.label} ${s.pct} %`).join(", ")}`}
        >
          <div className="h-[240px] w-[240px] rounded-full" style={{ background: gradient }} />
          <div className="absolute left-9 top-9 h-[168px] w-[168px] rounded-full bg-surface" />
          <div className="absolute inset-x-0 bottom-0 text-center">
            <b className="text-[32px] font-semibold leading-none tracking-[-1px]">{progress.total}</b>
            <div className="text-[12.5px] text-muted">tâches</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-muted">
          {progress.statuses.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2 w-2 rounded-[2px]" style={{ background: STATUS_COLOR[s.key] }} />
              {s.label} {s.pct} %
            </span>
          ))}
        </div>
        {progress.overdue > 0 && <p className="mt-2 text-[12.5px] text-late">{progress.overdue} en retard</p>}
      </div>
    </section>
  );
}
