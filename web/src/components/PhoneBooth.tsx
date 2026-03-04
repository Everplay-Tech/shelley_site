"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useCodecOverlay } from "@/hooks/useCodecOverlay";
import { useZoneSidebar } from "./ZoneSidebarContext";

export default function PhoneBooth() {
  const { openCodec } = useCodecOverlay();
  const zone = useZoneSidebar();
  const [open, setOpen] = useState(false);

  const handleCall = useCallback(() => {
    if (zone) {
      openCodec(zone.poCostume, zone.id);
    } else {
      openCodec("default", null);
    }
  }, [openCodec, zone]);

  return (
    <>
      {/* Panel */}
      <aside
        className={`phone-booth ${open ? "phone-booth--open" : ""}`}
        aria-label="Phone booth — call Po"
      >
        <div className="phone-booth-inner">
          <button
            onClick={handleCall}
            aria-label="Pick up the phone to talk to Po"
            className="phone-booth-phone"
          >
            <Image
              src="/images/ui/wall_phone.png"
              alt="Wall telephone"
              width={48}
              height={48}
              style={{ imageRendering: "pixelated" }}
              draggable={false}
            />
          </button>
          <span className="phone-booth-label">CALL</span>
        </div>
      </aside>

      {/* Toggle tab */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close phone booth" : "Open phone booth"}
        className={`phone-booth-tab ${open ? "phone-booth-tab--open" : ""}`}
      >
        <span className="phone-booth-tab-icon" aria-hidden="true">
          {open ? "\u260E" : "\u260E"}
        </span>
      </button>
    </>
  );
}
