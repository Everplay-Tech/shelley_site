"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ZoneId, PoCostumeId } from "@/lib/zone-config";

interface CodecOverlayState {
  isOpen: boolean;
  costume: PoCostumeId;
  zoneId: ZoneId | null;
  openCodec: (costume?: PoCostumeId, zoneId?: ZoneId | null) => void;
  closeCodec: () => void;
}

const CodecOverlayContext = createContext<CodecOverlayState | null>(null);

export function useCodecOverlay() {
  const ctx = useContext(CodecOverlayContext);
  if (!ctx) throw new Error("useCodecOverlay must be used within CodecProvider");
  return ctx;
}

export function CodecProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [costume, setCostume] = useState<PoCostumeId>("default");
  const [zoneId, setZoneId] = useState<ZoneId | null>(null);

  const openCodec = useCallback((c: PoCostumeId = "default", z: ZoneId | null = null) => {
    setCostume(c);
    setZoneId(z);
    setIsOpen(true);
  }, []);

  const closeCodec = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <CodecOverlayContext.Provider value={{ isOpen, costume, zoneId, openCodec, closeCodec }}>
      {children}
    </CodecOverlayContext.Provider>
  );
}
