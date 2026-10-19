"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { apiPost } from "@/lib/api";
import { longDate } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { Me } from "@/lib/types";

import { AvatarsProvider } from "./Avatar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * Cadre commun des écrans (hors tableau de bord) : barre latérale, barre du haut, état de connexion.
 * `children` reçoit le profil connecté ; `avatars` complète les avatars illustrés de l'écran.
 */
export function AppFrame({
  asOf,
  avatars = {},
  children,
}: {
  asOf?: string;
  avatars?: Record<string, string | null>;
  children: (me: Me) => ReactNode;
}) {
  const router = useRouter();
  const { me: loadedMe, error, waking } = useMe();
  const [meUpdate, setMeUpdate] = useState<Me | null>(null);
  const me = meUpdate ?? loadedMe;

  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) router.replace("/login");
  }, [error, router]);

  if (error && error.status !== 401 && error.status !== 403) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-medium">Le serveur ne répond pas.</p>
          <p className="mt-1 text-sm text-muted">{error.message}</p>
          <button className="btn btn-dark mt-4" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center text-muted" role="status">
        {waking ? (
          <div>
            <p className="font-medium text-ink">Démarrage du serveur…</p>
            <p className="mt-1 text-sm">Après une période d’inactivité, cela prend environ une minute. La page s’affichera toute seule.</p>
          </div>
        ) : (
          "Chargement…"
        )}
      </div>
    );
  }

  async function logout() {
    await apiPost("/auth/logout/");
    router.replace("/login");
  }

  return (
    <AvatarsProvider value={{ ...avatars, [me.name]: me.avatar }}>
      <div className="min-h-screen bg-surface">
        <div className="flex min-h-screen bg-surface p-2">
          <Sidebar me={me} subtitle={asOf ? longDate(asOf).replace(/^./, (c) => c.toUpperCase()) : me.role_label} />
          <main className="flex min-w-0 flex-1 flex-col">
            <Topbar me={me} onLogout={logout} onMeChange={setMeUpdate} />
            <div className="flex-1 rounded-[22px] bg-bg p-3 sm:p-4">{children(me)}</div>
          </main>
        </div>
      </div>
    </AvatarsProvider>
  );
}

/** En-tête d'écran : titre, sous-titre et actions à droite. */
export function PageHeader({ title, subtitle, aside }: { title: string; subtitle?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.4px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}
