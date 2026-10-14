import type { Dashboard, GanttProject } from "@/lib/types";

import { CardHeader } from "./ui";

// Une tuile par statut : libellé et pictogramme dans la couleur du statut, nombre de tâches en grand.
const STATUS: Record<string, { color: string; icon: string }> = {
  todo: { color: "#6b7280", icon: "M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5zM4 13h4.5l1 2h5l1-2H20" },
  doing: { color: "#2a56c6", icon: "M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v3.7h-3.7M6 21v-3.7h3.7" },
  done: { color: "#0f766e", icon: "M5 21V4M5 4h12l-2 4 2 4H5" },
  review: { color: "#d97706", icon: "M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.2-4.2" },
  approved: { color: "#1f7a4d", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.7 2.7L16 10" },
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
          const st = STATUS[s.key];
          return (
            <li
              key={s.key}
              className="flex min-h-[150px] flex-col items-center justify-center gap-4 rounded-xl border border-line px-2 py-4 text-center"
              aria-label={`${s.label} : ${s.count} tâche${s.count > 1 ? "s" : ""}`}
            >
              <span className="text-[12.5px] font-semibold leading-tight" style={{ color: st.color }}>
                {s.label}
              </span>
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke={st.color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={st.icon} />
              </svg>
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
