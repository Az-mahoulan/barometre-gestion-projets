"use client";

import type { Country, Me, Period } from "@/lib/types";

import { Avatar, Icon } from "./ui";

export function Topbar({
  me,
  countries,
  country,
  period,
  alerts,
  onCountry,
  onPeriod,
  onLogout,
}: {
  me: Me;
  countries: Country[];
  country: string;
  period: Period;
  alerts: number;
  onCountry: (code: string) => void;
  onPeriod: (p: Period) => void;
  onLogout: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center gap-2.5 px-2 pb-3 pt-1.5">
      <label className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-surface-2 pl-3.5 pr-1.5 text-[13px] text-muted">
        <Icon name="search" />
        <span className="sr-only">Rechercher</span>
        <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" placeholder="Rechercher un projet, une tâche… (bientôt)" disabled />
        <span className="grid h-7 w-7 place-items-center rounded-full bg-surface text-ink-2" aria-hidden="true">
          <Icon name="tune" className="h-4 w-4" />
        </span>
      </label>

      <label className="sr-only" htmlFor="f-country">
        Pays
      </label>
      <select id="f-country" className="field h-10 border-line" value={country} onChange={(e) => onCountry(e.target.value)}>
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
      <select id="f-period" className="field h-10 border-line" value={period} onChange={(e) => onPeriod(e.target.value as Period)}>
        <option value="year">Année en cours</option>
        <option value="quarter">Trimestre en cours</option>
        <option value="month">Mois en cours</option>
      </select>

      <span className="relative grid h-10 w-10 place-items-center rounded-full border border-line text-ink-2" role="img" aria-label={`${alerts} actions à traiter`}>
        <Icon name="bell" className="h-5 w-5" />
        {alerts > 0 && <i className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full border-2 border-surface bg-[#f26b3a]" />}
      </span>
      <button onClick={onLogout} className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-2 hover:text-ink" aria-label="Se déconnecter" title="Se déconnecter">
        <Icon name="logout" className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2.5 rounded-full border border-line py-1 pl-1 pr-3">
        <Avatar initials={me.initials} size="h-9 w-9 text-[12px]" />
        <div className="leading-tight">
          <b className="block text-[13px] font-bold">{me.name}</b>
          <small className="text-[11.5px] text-muted">{me.role_label}</small>
        </div>
        <Icon name="caretdown" className="h-4 w-4 text-muted" />
      </div>
    </header>
  );
}
