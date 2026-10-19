import type { ActivityEntry } from "@/lib/types";

import { Avatar, CardHeader } from "./ui";

export function relative(iso: string, now: Date): string {
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
      {entries.length === 0 && <p className="text-[12.5px] text-muted">Aucune activité récente.</p>}
      <ul className="flex flex-col gap-1">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-2.5 py-2">
            <Avatar initials={e.actor_initials || "·"} seed={e.actor_name || undefined} size="h-[30px] w-[30px] text-[10.5px]" />
            <div className="min-w-0">
              <p className="text-[12px] leading-snug">{e.message}</p>
              <small className="text-[11px] text-muted">
                {relative(e.created_at, ref)} · {e.project}
              </small>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
