"use client";

import type { Country, Me, Period } from "@/lib/types";

import { Avatar, Icon } from "./ui";

export function Topbar({
  me,
  subtitle,
  countries,
  country,
  period,
  alerts,
  onCountry,
  onPeriod,
  onLogout,
}: {
  me: Me;
  subtitle: string;
  countries: Country[];
  country: string;
  period: Period;
  alerts: number;
  onCountry: (code: string) => void;
  onPeriod: (p: Period) => void;
  onLogout: () => void;
}) {
  const first = me.name.split(" ")[0];
  return (
    <header className="mb-5 flex flex-wrap items-center gap-3">
      <div className="mr-auto">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.5px]">
          Bonjour{me.name !== me.role_label && first !== "Administration" ? ` ${first}` : ""}
        </h1>
        <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
      </div>

      <label className="flex h-[42px] w-full max-w-[260px] items-center gap-2 rounded-full bg-surface px-4 text-[13px] text-muted">
        <Icon name="search" />
        <span className="sr-only">Rechercher</span>
        <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" placeholder="Rechercher (bientôt)" disabled />
      </label>
      <label className="sr-only" htmlFor="f-country">
        Pays
      </label>
      <select id="f-country" className="field h-[42px] border-0" value={country} onChange={(e) => onCountry(e.target.value)}>
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
      <select id="f-period" className="field h-[42px] border-0" value={period} onChange={(e) => onPeriod(e.target.value as Period)}>
        <option value="year">Année en cours</option>
        <option value="quarter">Trimestre en cours</option>
        <option value="month">Mois en cours</option>
      </select>
      <span className="relative grid h-[42px] w-[42px] place-items-center rounded-full bg-surface" aria-label={`${alerts} actions à traiter`} role="img">
        <Icon name="bell" className="h-5 w-5" />
        {alerts > 0 && <i className="absolute right-[11px] top-[10px] h-2 w-2 rounded-full border-2 border-surface bg-late" />}
      </span>
      <span title={`${me.name}, ${me.role_label}`}>
        <Avatar initials={me.initials} size="h-[42px] w-[42px] text-[13px]" />
      </span>
      <button onClick={onLogout} className="grid h-[42px] w-[42px] place-items-center rounded-full bg-surface text-ink-2 hover:text-ink" aria-label="Se déconnecter" title="Se déconnecter">
        <Icon name="logout" className="h-5 w-5" />
      </button>
    </header>
  );
}
