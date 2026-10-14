"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, apiGet, retryWhileWaking } from "./api";
import type { Country, Dashboard, Me, Period } from "./types";

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    retryWhileWaking(() => apiGet<Me>("/auth/me/", controller.signal), () => setWaking(true), controller.signal)
      .then(setMe)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e as ApiError);
      })
      .finally(() => setWaking(false));
    return () => controller.abort();
  }, []);

  return { me, error, waking };
}

export function useCountries(enabled: boolean) {
  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    apiGet<Country[]>("/countries/", controller.signal)
      .then(setCountries)
      .catch(() => undefined);
    return () => controller.abort();
  }, [enabled]);
  return countries;
}

export interface DashboardParams {
  country: string;
  period: Period;
  week: number;
  trendProject: string;
  tasksProject: string;
}

export function useDashboard(params: DashboardParams, enabled: boolean) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const id = ++latest.current;
    const query = new URLSearchParams({ period: params.period, week: String(params.week) });
    if (params.country) query.set("country", params.country);
    if (params.trendProject) query.set("trend_project", params.trendProject);
    if (params.tasksProject) query.set("tasks_project", params.tasksProject);
    apiGet<Dashboard>(`/dashboard/?${query}`, controller.signal)
      .then((d) => {
        if (id !== latest.current) return;
        setData(d);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name === "AbortError" || id !== latest.current) return;
        setError(e as ApiError);
        setLoading(false);
      });
    return () => controller.abort();
  }, [enabled, params.country, params.period, params.week, params.trendProject, params.tasksProject, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, loading, refresh };
}
