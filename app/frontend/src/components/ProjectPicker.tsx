"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { GanttProject } from "@/lib/types";

import { HEALTH_BAR, Icon } from "./ui";

const HEALTH_LABEL: Record<GanttProject["health"], string> = {
  ok: "Dans les temps",
  risk: "À surveiller",
  late: "En retard",
  completed: "Achevé",
};

type Tab = "running" | "done";
const TABS: { key: Tab; label: string }[] = [
  { key: "running", label: "En cours" },
  { key: "done", label: "Achevés" },
];

/**
 * Filtre par projet : pilule claire (vert-citron quand un projet est choisi) et panneau compact.
 * Les projets sont répartis en deux onglets, « En cours » et « Achevés » ; la liste défile si elle est longue.
 */
export function ProjectPicker({
  projects,
  value,
  onChange,
  label = "Filtrer par projet",
}: {
  projects: GanttProject[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const current = projects.find((p) => String(p.id) === value);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("running");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  const inTab = (t: Tab) => projects.filter((p) => (p.health === "completed") === (t === "done"));
  const ids = ["", ...inTab(tab).map((p) => String(p.id))];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const show = () => {
    const t: Tab = current?.health === "completed" ? "done" : "running";
    setTab(t);
    setActive(Math.max(0, ["", ...inTab(t).map((p) => String(p.id))].indexOf(value)));
    setOpen(true);
  };
  const switchTab = (t: Tab) => {
    setTab(t);
    setActive(0);
  };
  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") setActive((a) => Math.min(ids.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") switchTab(tab === "running" ? "done" : "running");
    else if (e.key === "Enter" || e.key === " ") choose(ids[active]);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label} : ${current ? current.name : "tous les projets"}`}
        onClick={() => (open ? setOpen(false) : show())}
        className={`flex h-9 max-w-[220px] items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-[12.5px] font-semibold text-ink transition-colors ${
          current ? "bg-lime" : open ? "bg-[#e9e9e2]" : "bg-surface-2 hover:bg-[#e9e9e2]"
        }`}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-ink-2 shadow-[0_1px_2px_rgba(28,29,34,0.08)]">
          <Icon name={current ? "project" : "tune"} className="h-4 w-4" />
        </span>
        {current && <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: HEALTH_BAR[current.health] }} />}
        <span className="truncate">{current ? current.name : "Tous les projets"}</span>
        <Icon name={open ? "caretup" : "caretdown"} className="h-4 w-4 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[236px] rounded-[18px] border border-line bg-surface p-1.5 shadow-[0_16px_36px_-14px_rgba(28,29,34,0.28)]">
          <button
            type="button"
            onClick={() => choose("")}
            onMouseEnter={() => setActive(0)}
            className={`flex w-full items-center gap-2 rounded-[12px] px-2 py-1.5 text-left text-[12.5px] font-semibold ${
              value === "" ? "bg-lime" : active === 0 ? "bg-surface-2" : ""
            }`}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] bg-surface-2 text-ink-2">
              <Icon name="grid" className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1">Tous les projets</span>
            <span className="rounded-full bg-ink px-1.5 py-px text-[10.5px] font-bold text-white">{projects.length}</span>
          </button>

          <div role="tablist" aria-label="Statut des projets" className="mx-0.5 my-1.5 grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => switchTab(t.key)}
                className={`rounded-full py-1 text-[11.5px] font-semibold transition-colors ${
                  tab === t.key ? "bg-surface text-ink shadow-[0_1px_3px_rgba(28,29,34,0.12)]" : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            aria-activedescendant={active > 0 ? `${listId}-${active}` : undefined}
            className={`flex max-h-[176px] flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              inTab(tab).length > 5 ? "pb-3 [mask-image:linear-gradient(to_bottom,#000_82%,transparent)]" : ""
            }`}
          >
            {inTab(tab).length === 0 && <li className="px-2 py-2 text-[12px] text-muted">Aucun projet.</li>}
            {inTab(tab).map((p, i) => {
              const selected = String(p.id) === value;
              return (
                <li
                  key={p.id}
                  id={`${listId}-${i + 1}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i + 1)}
                  onClick={() => choose(String(p.id))}
                  title={`${p.name} · ${HEALTH_LABEL[p.health]}`}
                  className={`flex cursor-pointer items-center gap-2 rounded-[12px] px-2 py-1.5 text-[12.5px] ${
                    selected ? "bg-lime font-semibold" : active === i + 1 ? "bg-surface-2" : ""
                  }`}
                >
                  <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: HEALTH_BAR[p.health] }} />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  {selected && <Icon name="check" className="h-3.5 w-3.5 shrink-0" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
