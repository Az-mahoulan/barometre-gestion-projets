"use client";

import Link from "next/link";
import { useState } from "react";

import { apiPost } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { CriticalItem, Notifications } from "@/lib/types";

import { relative } from "../ActivityCard";
import { AppFrame, PageHeader } from "../AppFrame";
import { Avatar, Icon, Tile, TONES, type Tone } from "../ui";

const GROUPS: { key: CriticalItem["severity"]; label: string; tone: Tone; icon: string }[] = [
  { key: "late", label: "En retard", tone: "rose", icon: "clock" },
  { key: "risk", label: "Échéances proches", tone: "sand", icon: "event" },
  { key: "info", label: "À approuver", tone: "lav", icon: "review" },
];

/** Écran « Notifications » : ce qui est à traiter maintenant, puis le fil des projets (non-lus mis en avant). */
export function NotificationsScreen() {
  const { data, error, refresh } = useApi<Notifications>("/notifications/");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };
  async function act(item: CriticalItem) {
    if (!item.task_id) return;
    const key = `${item.kind}-${item.task_id}`;
    setBusy(key);
    try {
      if (item.action === "remind") say((await apiPost<{ detail: string }>(`/tasks/${item.task_id}/remind/`)).detail);
      if (item.action === "approve") {
        await apiPost(`/tasks/${item.task_id}/status/`, { status: "approved" });
        say(`« ${item.title} » approuvée.`);
      }
      refresh();
    } catch (e) {
      say((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function markAllRead() {
    await apiPost("/notifications/seen/");
    refresh();
  }

  const feed = (data?.feed ?? []).filter((f) => !onlyUnread || (f.unread && !f.mine));

  return (
    <AppFrame asOf={data?.as_of} avatars={data?.avatars}>
      {() => (
        <>
          <PageHeader
            title="Notifications"
            subtitle={data ? `${data.to_handle.total} à traiter · ${data.unread} non lue${data.unread > 1 ? "s" : ""}` : " "}
            aside={
              data && data.unread > 0 ? (
                <button onClick={markAllRead} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime px-3.5 text-[12.5px] font-semibold text-ink">
                  <Icon name="check" className="h-4 w-4" />
                  Tout marquer comme lu
                </button>
              ) : null
            }
          />

          {error && !data ? (
            <div className="card text-center">
              <p className="font-medium">Impossible de charger les notifications.</p>
              <button className="btn btn-dark mt-3" onClick={refresh}>
                Réessayer
              </button>
            </div>
          ) : !data ? (
            <p className="card text-muted" role="status">
              Chargement…
            </p>
          ) : (
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {/* À traiter */}
              <section className="flex flex-col gap-4" aria-label="À traiter">
                {GROUPS.map((g) => {
                  const items = data.to_handle.items.filter((i) => i.severity === g.key);
                  return (
                    <div key={g.key} className="card">
                      <div className="mb-2 flex items-center justify-between">
                        <b className="flex items-center gap-2 text-[15px] font-bold">
                          <span className={`grid h-7 w-7 place-items-center rounded-full ${TONES[g.tone]}`}>
                            <Icon name={g.icon} className="h-4 w-4" />
                          </span>
                          {g.label}
                        </b>
                        <span className={`chip ${items.length ? TONES[g.tone] : "bg-surface-2 text-muted"}`}>{items.length}</span>
                      </div>
                      {items.length === 0 && <p className="py-1 text-[12.5px] text-muted">Rien à signaler.</p>}
                      <ul className="flex flex-col divide-y divide-line">
                        {items.map((it) => {
                          const key = `${it.kind}-${it.task_id}`;
                          return (
                            <li key={`${it.kind}-${it.task_id ?? it.project_id}-${it.title}`} className="flex items-center gap-3 py-2.5">
                              <Tile icon={it.kind === "milestone_overdue" ? "flag" : g.icon} tone={g.tone} className="h-9 w-9" />
                              <div className="min-w-0 flex-1">
                                <b className="block text-[13px] font-semibold leading-snug">{it.title}</b>
                                <small className="block truncate text-[11.5px] text-muted">{it.subtitle}</small>
                              </div>
                              {it.action && it.action !== "reschedule" && (
                                <button className="btn btn-sm shrink-0" disabled={busy === key} onClick={() => act(it)}>
                                  {it.action === "remind" ? "Relancer" : "Approuver"}
                                </button>
                              )}
                              {it.project_id && it.kind === "milestone_overdue" && (
                                <Link href={`/projets/${it.project_id}`} className="btn btn-sm shrink-0">
                                  Voir le projet
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </section>

              {/* Fil des projets */}
              <section className="card" aria-label="Fil des projets">
                <div className="mb-2 flex items-center justify-between">
                  <b className="text-[15px] font-bold">Fil des projets</b>
                  <button
                    aria-pressed={onlyUnread}
                    onClick={() => setOnlyUnread(!onlyUnread)}
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${onlyUnread ? "bg-side text-white" : "bg-surface-2 text-ink-2 hover:text-ink"}`}
                  >
                    Non lues seulement
                  </button>
                </div>
                <ul className="flex flex-col">
                  {feed.map((f) => (
                    <li key={f.id} className={`flex gap-3 rounded-[12px] px-2 py-2.5 ${f.unread && !f.mine ? "bg-lime/15" : ""}`}>
                      <Avatar initials={f.actor_initials} seed={f.actor_name} size="h-8 w-8 text-[10px]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] leading-snug">
                          {f.message}
                          {f.for_me && <span className="chip ml-1.5 bg-late-soft px-1.5 py-0 text-[10px] text-late">Pour vous</span>}
                        </p>
                        <small className="text-[11px] text-muted">
                          {relative(f.created_at, new Date(data.now))} ·{" "}
                          <Link href={`/projets/${f.project.id}`} className="font-medium text-ink-2 hover:underline">
                            {f.project.name}
                          </Link>
                        </small>
                      </div>
                      {f.unread && !f.mine && <i className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#f26b3a]" aria-label="Non lue" />}
                    </li>
                  ))}
                  {feed.length === 0 && <li className="py-2 text-[12.5px] text-muted">{onlyUnread ? "Tout est lu." : "Rien pour l’instant."}</li>}
                </ul>
              </section>
            </div>
          )}

          {toast && (
            <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-side px-4 py-2 text-[12.5px] font-medium text-white shadow-lg">
              {toast}
            </div>
          )}
        </>
      )}
    </AppFrame>
  );
}
