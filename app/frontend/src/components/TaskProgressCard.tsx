import type { Dashboard } from "@/lib/types";

import { CardHeader } from "./ui";

const COLORS: Record<string, string> = {
  todo: "var(--s-todo)",
  doing: "var(--s-doing)",
  done: "var(--s-done)",
  review: "var(--s-review)",
  approved: "var(--s-approved)",
};

export function TaskProgressCard({ progress }: { progress: Dashboard["task_progress"] }) {
  // Demi-anneau : les statuts occupent la moitié supérieure d'un cercle en dégradé conique.
  const total = Math.max(progress.total, 1);
  const stops = progress.statuses
    .filter((s) => s.count > 0)
    .map((s, i, all) => {
      const from = all.slice(0, i).reduce((sum, x) => sum + x.count, 0);
      return `${COLORS[s.key]} ${(from / total) * 50}% ${((from + s.count) / total) * 50}%`;
    });
  const gradient = `conic-gradient(from -90deg, ${stops.join(", ") || "var(--s-todo) 0% 50%"}, transparent 50% 100%)`;

  return (
    <section className="card" aria-label="Progression des tâches">
      <CardHeader title="Progression des tâches" />
      <div className="relative mx-auto mb-1.5 mt-5 h-[122px] w-[240px] overflow-hidden" role="img" aria-label={`${progress.total} tâches au total`}>
        <div className="h-[240px] w-[240px] rounded-full" style={{ background: gradient }} />
        <div className="absolute left-9 top-9 h-[168px] w-[168px] rounded-full bg-surface" />
        <div className="absolute inset-x-0 bottom-0 text-center">
          <b className="text-[34px] font-semibold leading-none tracking-[-1px]">{progress.total}</b>
          <div className="text-[12.5px] text-muted">tâches</div>
        </div>
      </div>

      <ul>
        {progress.statuses.map((s) => (
          <li key={s.key} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2.5 py-1.5 text-[13.5px]">
            <i className="block h-2.5 w-2.5 rounded-[3px]" style={{ background: COLORS[s.key] }} />
            {s.label}
            <b className="font-semibold">{s.count}</b>
            <span className="min-w-[34px] text-right text-[12.5px] text-muted">{s.pct} %</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
