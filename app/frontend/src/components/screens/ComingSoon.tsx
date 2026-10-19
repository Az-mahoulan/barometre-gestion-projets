"use client";

import Link from "next/link";

import { AppFrame, PageHeader } from "../AppFrame";
import { Icon } from "../ui";

/** Écran pas encore développé : ce qu'il contiendra, et un retour vers le tableau de bord. */
export function ComingSoon({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  return (
    <AppFrame>
      {() => (
        <>
          <PageHeader title={title} subtitle="Écran en préparation" />
          <section className="card max-w-[640px]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-lime text-ink">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <p className="text-[13.5px] font-semibold">Cet écran arrive bientôt. Il contiendra :</p>
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {items.map((it) => (
                <li key={it} className="flex gap-2 text-[13px] text-ink-2">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                  {it}
                </li>
              ))}
            </ul>
            <Link href="/" className="btn btn-dark mt-5 inline-flex">
              Revenir au tableau de bord
            </Link>
          </section>
        </>
      )}
    </AppFrame>
  );
}
