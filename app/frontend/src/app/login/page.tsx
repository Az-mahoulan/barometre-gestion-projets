"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <div className="w-full max-w-[360px]">
        <p className="mb-6 text-[20px] font-semibold tracking-[-0.2px]">Baromètre</p>
        <form onSubmit={onSubmit} className="panel p-7">
          <h1 className="text-[20px] font-semibold">Connexion</h1>
          <p className="mt-1 text-ink-2">Pilotage des projets internes.</p>

          <label className="mt-6 block font-medium" htmlFor="username">
            Identifiant
          </label>
          <input id="username" name="username" autoComplete="username" required className="field mt-1.5 w-full" />

          <label className="mt-4 block font-medium" htmlFor="password">
            Mot de passe
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field mt-1.5 w-full" />

          {error && (
            <p role="alert" className="mt-4 rounded-md bg-late-soft px-3 py-2 text-late">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
