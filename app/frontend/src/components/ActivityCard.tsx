import type { ActivityEntry } from "@/lib/types";

import { Avatar, CardHeader } from "./ui";

function relative(iso: string, now: Date): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `il y a ${Math.max(minutes, 1)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "hier" : `il y a ${days} jours`;
}

export function ActivityCard({ entries, now }: { entries: ActivityEntry[]; now: string }) {
  const ref = new Date(now);
  return (
    <section className="card" aria-label="Activités récentes">
      <CardHeader title="Activités récentes" />
      {entries.length === 0 && <p className="py-4 text-sm text-muted">Aucune activité récente.</p>}
      <ul>
        {entries.map((e) => (
          <li key={e.id} className="flex items-center gap-3 border-t border-[#f1f3f5] py-2.5 text-[13.5px] first:border-t-0">
            <Avatar initials={e.actor_initials || "·"} />
            <div className="min-w-0">
              {e.message}
              <small className="block text-xs text-muted">
                {relative(e.created_at, ref)} · {e.project}
              </small>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
