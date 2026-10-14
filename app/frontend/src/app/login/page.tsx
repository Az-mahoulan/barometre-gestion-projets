"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/ui";
import { apiPost } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await apiPost("/auth/login/", { username: form.get("username"), password: form.get("password") });
      router.replace("/");
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-[380px] !p-7">
        <div className="mb-6 flex items-center gap-2.5 text-xl font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white">
            <Icon name="chart" />
          </span>
          Baromètre
        </div>
        <h1 className="text-lg font-semibold">Connexion</h1>
        <p className="mt-1 text-sm text-muted">Accédez au pilotage des projets.</p>

        <label className="mt-5 block text-sm font-medium" htmlFor="username">
          Identifiant
        </label>
        <input id="username" name="username" autoComplete="username" required className="field mt-1.5 w-full" />

        <label className="mt-4 block text-sm font-medium" htmlFor="password">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field mt-1.5 w-full" />

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-late-soft px-3 py-2 text-sm text-late">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-dark mt-6 w-full justify-center" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
