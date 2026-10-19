"use client";

import { useState } from "react";

import { useApi, useCountries } from "@/lib/hooks";
import type { Health, ProjectsList } from "@/lib/types";

import { AppFrame, PageHeader } from "../AppFrame";
import { ProjectsTable } from "../ProjectsTable";
import { Icon } from "../ui";

// Filtres rapides par état, avec le nombre de projets concernés.
const FILTERS: { key: "all" | Health; label: string; dot?: string }[] = [
  { key: "all", label: "Tous" },
  { key: "late", label: "En retard", dot: "bg-late" },
  { key: "risk", label: "À surveiller", dot: "bg-risk" },
  { key: "ok", label: "Dans les temps", dot: "bg-ok" },
  { key: "completed", label: "Achevés", dot: "bg-ink-2" },
];

/** Écran « Projets » : tous les projets visibles, filtrables par état, pays et nom. */
export function ProjectsScreen() {
  const [country, setCountry] = useState("");
  const [health, setHealth] = useState<"all" | Health>("all");
  const [q, setQ] = useState("");
  const { data, error, refresh } = useApi<ProjectsList>(`/projects/${country ? `?country=${country}` : ""}`);
  const countries = useCountries(true);

  const all = data?.projects ?? [];
  const count = (k: "all" | Health) => (k === "all" ? all.length : all.filter((p) => p.health === k).length);
  const shown = all.filter((p) => (health === "all" || p.health === health) && p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <AppFrame asOf={data?.as_of} avatars={data?.avatars}>
      {() => (
        <>
          <PageHeader
            title="Projets"
            subtitle={data ? `${all.length} projet${all.length > 1 ? "s" : ""} · cliquez sur un projet pour ouvrir son détail` : " "}
            aside={
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-9 w-[220px] items-center gap-2 rounded-full bg-surface pl-3.5 pr-3 text-[12.5px] text-muted">
                  <Icon name="search" className="h-4 w-4" />
                  <span className="sr-only">Rechercher un projet</span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher un projet"
                    className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
                  />
                </label>
                <label className="sr-only" htmlFor="p-country">
                  Pays
                </label>
                <select id="p-country" className="field h-9 border-line bg-surface" value={country} onChange={(e) => setCountry(e.target.value)}>
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

          <div role="radiogroup" aria-label="Filtrer par état" className="mb-4 flex flex-wrap gap-2 px-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="radio"
                aria-checked={health === f.key}
                onClick={() => setHealth(f.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  health === f.key ? "bg-side text-white" : "bg-surface text-ink-2 hover:text-ink"
                }`}
              >
                {f.dot && <i className={`h-2 w-2 rounded-full ${f.dot}`} />}
                {f.label}
                <span className={`text-[11px] ${health === f.key ? "text-white/70" : "text-muted"}`}>{count(f.key)}</span>
              </button>
            ))}
          </div>

          {error && !data ? (
            <div className="card text-center">
              <p className="font-medium">Impossible de charger les projets.</p>
              <p className="mt-1 text-sm text-muted">{error.message}</p>
              <button className="btn btn-dark mt-3" onClick={refresh}>
                Réessayer
              </button>
            </div>
          ) : !data ? (
            <p className="card text-muted" role="status">
              Chargement…
            </p>
          ) : (
            <ProjectsTable projects={shown} now={data.now} title={false} />
          )}
        </>
      )}
    </AppFrame>
  );
}
