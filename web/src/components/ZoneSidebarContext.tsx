"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ZoneConfig } from "@/lib/zone-config";

interface ZoneSidebarContextValue {
  zone: ZoneConfig | null;
  setZone: (zone: ZoneConfig | null) => void;
}

const ZoneSidebarContext = createContext<ZoneSidebarContextValue>({
  zone: null,
  setZone: () => {},
});

export function ZoneSidebarProvider({ children }: { children: React.ReactNode }) {
  const [zone, setZone] = useState<ZoneConfig | null>(null);
  return (
    <ZoneSidebarContext.Provider value={{ zone, setZone }}>
      {children}
    </ZoneSidebarContext.Provider>
  );
}

export function useZoneSidebar() {
  return useContext(ZoneSidebarContext).zone;
}

export function useSetZoneSidebar(zone: ZoneConfig) {
  const { setZone } = useContext(ZoneSidebarContext);

  useEffect(() => {
    setZone(zone);
    return () => setZone(null);
  }, [zone, setZone]);
}
