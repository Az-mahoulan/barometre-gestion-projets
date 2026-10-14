import type { ActivityEntry } from "@/lib/types";

import { Avatar, Section } from "./ui";

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
    <Section title="Activité récente" bodyClassName="px-5 py-1">
      {entries.length === 0 && <p className="py-5 text-muted">Aucune activité récente.</p>}
      <ul>
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-3 border-t border-line-soft py-3 first:border-t-0">
            <Avatar initials={e.actor_initials || "?"} />
            <div className="min-w-0 flex-1">
              <span className="block">{e.message}</span>
              <span className="block truncate text-[13px] text-muted">{e.project}</span>
            </div>
            <span className="shrink-0 whitespace-nowrap text-[13px] text-muted">{relative(e.created_at, ref)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
