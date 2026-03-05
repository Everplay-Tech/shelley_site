"use client";

import { useState, useCallback, useEffect } from "react";

export interface GameSave {
  id: number;
  slot: number;
  gameName: string;
  label: string;
  saveData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function useGameSaves(gameName: string) {
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSaves = useCallback(async () => {
    if (!gameName) return [];
    setIsLoading(true);
    try {
      const res = await fetch(`/api/saves?game=${encodeURIComponent(gameName)}`);
      if (!res.ok) {
        setSaves([]);
        return [];
      }
      const data = await res.json();
      setSaves(data.saves ?? []);
      return data.saves as GameSave[];
    } catch {
      setSaves([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [gameName]);

  // Fetch on mount
  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const save = useCallback(
    async (slot: number, saveData: Record<string, unknown>, label?: string) => {
      const res = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: gameName, slot, saveData, label }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Refresh list
      await fetchSaves();
      return data.save as GameSave;
    },
    [gameName, fetchSaves]
  );

  const load = useCallback(
    (slot: number): GameSave | undefined => {
      return saves.find((s) => s.slot === slot);
    },
    [saves]
  );

  const remove = useCallback(
    async (slot: number) => {
      await fetch("/api/saves", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: gameName, slot }),
      });
      await fetchSaves();
    },
    [gameName, fetchSaves]
  );

  return { saves, isLoading, save, load, remove, refetch: fetchSaves } as const;
}
