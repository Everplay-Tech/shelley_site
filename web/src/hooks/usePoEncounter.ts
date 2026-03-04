"use client";

import { useContext } from "react";
import { PoEncounterContext } from "@/components/PoEncounterProvider";

export type EncounterType =
  | "paper_plane"
  | "knock"
  | "codec_ring"
  | "cursor_stalk"
  | "zone_drop";

export type EncounterPhase =
  | "idle"
  | "entering"
  | "waiting"
  | "accepted"
  | "dismissed"
  | "exiting";

export interface PoEncounterState {
  activeEncounter: EncounterType | null;
  encounterPhase: EncounterPhase;
  acceptEncounter: () => void;
  dismissEncounter: () => void;
  clearEncounter: () => void;
  triggerEncounter: (type: EncounterType) => void;
}

export function usePoEncounter(): PoEncounterState {
  const ctx = useContext(PoEncounterContext);
  if (!ctx) throw new Error("usePoEncounter must be used within PoEncounterProvider");
  return ctx;
}
