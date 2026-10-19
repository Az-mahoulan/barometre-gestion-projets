"use client";

import Link from "next/link";
import { useState } from "react";

import { shortDate } from "@/lib/format";
import { useApi, useCountries } from "@/lib/hooks";
import type { Member, TeamScreen } from "@/lib/types";

import { AppFrame, PageHeader } from "../AppFrame";
import { Avatar, Icon, TONES, type Tone } from "../ui";

const STATUS: Record<Member["status"], { tone: Tone; icon: string; label: string }> = {
  available: { tone: "mint", icon: "taskalt", label: "Disponibles" },
  meeting: { tone: "lav", icon: "users", label: "En réunion" },
  mission: { tone: "sky", icon: "mission", label: "En mission" },
  training: { tone: "sand", icon: "training", label: "En formation" },
  leave: { tone: "gray", icon: "leave", label: "En congé" },
};

// Charge : tâches en cours, rapportée à un repère de 8 tâches (au-delà, la barre est pleine).
const FULL_LOAD = 8;

/** Écran « Équipes » : qui est disponible, où, avec quelle charge et sur quels projets. */
export function TeamsScreen() {
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<"all" | Member["status"]>("all");
  const [q, setQ] = useState("");
  const { data, error, refresh } = useApi<TeamScreen>(`/teams/${country ? `?country=${country}` : ""}`);
  const countries = useCountries(true);

  const all = data?.members ?? [];
  const shown = all.filter((m) => (status === "all" || m.status === status) && `${m.name} ${m.job_title}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <AppFrame asOf={data?.as_of} avatars={data?.avatars}>
      {() => (
        <>
          <PageHeader
            title="Équipes"
            subtitle={data ? `${data.available} disponible${data.available > 1 ? "s" : ""} sur ${data.total}` : " "}
            aside={
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-9 w-[220px] items-center gap-2 rounded-full bg-surface pl-3.5 pr-3 text-[12.5px] text-muted">
                  <Icon name="search" className="h-4 w-4" />
                  <span className="sr-only">Rechercher une personne</span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou fonction" className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted" />
                </label>
                <select aria-label="Pays" className="field h-9 border-line bg-surface" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">Tous les pays</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            }
          />

          {/* Disponibilité : un compteur par statut, cliquable pour filtrer */}
          <div role="radiogroup" aria-label="Filtrer par disponibilité" className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
            <button role="radio" aria-checked={status === "all"} onClick={() => setStatus("all")} className={`card py-3 text-left ${status === "all" ? "ring-2 ring-ink" : ""}`}>
              <small className="block text-[11.5px] text-muted">Tout le monde</small>
              <b className="text-[22px] font-bold">{all.length}</b>
            </button>
            {(Object.keys(STATUS) as Member["status"][]).map((k) => (
              <button key={k} role="radio" aria-checked={status === k} onClick={() => setStatus(k)} className={`card py-3 text-left ${status === k ? "ring-2 ring-ink" : ""}`}>
                <small className="flex items-center gap-1.5 text-[11.5px] text-muted">
                  <span className={`grid h-5 w-5 place-items-center rounded-full ${TONES[STATUS[k].tone]}`}>
                    <Icon name={STATUS[k].icon} className="h-3 w-3" />
                  </span>
                  {STATUS[k].label}
                </small>
                <b className="text-[22px] font-bold">{all.filter((m) => m.status === k).length}</b>
              </button>
            ))}
          </div>

          {error && !data ? (
            <div className="card text-center">
              <p className="font-medium">Impossible de charger les équipes.</p>
              <button className="btn btn-dark mt-3" onClick={refresh}>
                Réessayer
              </button>
            </div>
          ) : !data ? (
            <p className="card text-muted" role="status">
              Chargement…
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {shown.map((m) => {
                const st = STATUS[m.status];
                const load = Math.min(1, m.open_tasks / FULL_LOAD);
                return (
                  <li key={m.id} className="card flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={m.initials} seed={m.name} size="h-12 w-12 text-[13px]" />
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-[14px] font-bold">{m.name}</b>
                        <small className="block truncate text-[12px] text-muted">
                          {m.job_title}
                          {m.country ? ` · ${m.country}` : ""}
                        </small>
                      </div>
                      <span className="chip shrink-0 bg-surface-2 text-ink-2">{m.role_label}</span>
                    </div>

                    <div className="rounded-[14px] bg-surface-2/60 px-3 py-2.5">
                      <span className={`chip ${TONES[st.tone]}`}>
                        <Icon name={st.icon} className="h-3.5 w-3.5" />
                        {m.status_label}
                        {/* La date de retour figure souvent déjà dans la raison : on ne la répète pas. */}
                        {m.until && m.status !== "available" && !/jusqu|retour/i.test(m.reason) ? ` jusqu’au ${shortDate(m.until)}` : ""}
                      </span>
                      <p className="mt-1.5 text-[12px] leading-snug text-ink-2">{m.reason ? `${m.reason.replace(/\.$/, "")} · ${m.place_label}` : m.place_label}</p>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between text-[12px]">
                        <span className="text-muted">Charge</span>
                        <span>
                          <b className="font-semibold">{m.open_tasks}</b> <span className="text-muted">en cours</span>
                          {m.overdue_tasks > 0 && <b className="text-late"> · {m.overdue_tasks} en retard</b>}
                          {m.due_soon > 0 && <span className="text-muted"> · {m.due_soon} sous 7 j</span>}
                        </span>
                      </div>
                      <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-track" title={`${m.open_tasks} tâches en cours`}>
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${Math.max(load * 100, m.open_tasks ? 6 : 0)}%`, background: m.overdue_tasks ? "var(--bar-late)" : load > 0.75 ? "var(--bar-risk)" : "var(--bar-ok)" }}
                        />
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {m.projects.length === 0 && <small className="text-[12px] text-muted">Aucun projet en cours.</small>}
                      {m.projects.map((p) => (
                        <Link key={p.id} href={`/projets/${p.id}`} className="chip bg-surface-2 text-ink-2 hover:text-ink" title={p.owner ? "Responsable du projet" : undefined}>
                          {p.owner && <Icon name="flag" className="h-3 w-3" />}
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  </li>
                );
              })}
              {shown.length === 0 && <li className="card text-muted">Personne pour ces filtres.</li>}
            </ul>
          )}
        </>
      )}
    </AppFrame>
  );
}
