"use client";

import type { Country, Period } from "@/lib/types";

import { Icon } from "./ui";

export function Topbar({
  countries,
  country,
  period,
  alerts,
  onCountry,
  onPeriod,
}: {
  countries: Country[];
  country: string;
  period: Period;
  alerts: number;
  onCountry: (code: string) => void;
  onPeriod: (p: Period) => void;
}) {
  return (
    <header className="flex min-h-[68px] flex-wrap items-center gap-3 border-b border-line bg-surface px-6 py-2">
      <label className="flex h-10 w-full max-w-[380px] items-center gap-2.5 rounded-[11px] border border-line bg-surface-2 px-3 text-[13.5px] text-muted">
        <Icon name="search" />
        <span className="sr-only">Rechercher ou demander à l’assistant</span>
        <input
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
          placeholder="Rechercher ou demander à l’assistant"
          disabled
          title="La recherche arrive à l’étape suivante"
        />
        <kbd className="rounded-md border border-line-strong bg-surface px-1.5 text-xs text-ink-2">⌘ K</kbd>
      </label>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="f-country">
          Pays
        </label>
        <select id="f-country" className="field" value={country} onChange={(e) => onCountry(e.target.value)}>
          <option value="">Tous les pays</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-period">
          Période
        </label>
        <select id="f-period" className="field" value={period} onChange={(e) => onPeriod(e.target.value as Period)}>
          <option value="year">Année en cours</option>
          <option value="quarter">Trimestre en cours</option>
          <option value="month">Mois en cours</option>
        </select>
        <button className="relative grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2" aria-label={`Notifications, ${alerts} à traiter`}>
          <Icon name="bell" />
          {alerts > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-surface bg-[var(--bar-late)]" />}
        </button>
      </div>
    </header>
  );
}
