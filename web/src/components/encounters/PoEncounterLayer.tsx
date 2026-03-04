"use client";

import dynamic from "next/dynamic";

/* -----------------------------------------
   PoEncounterLayer — unified overlay for all 5 encounter triggers.
   Each component self-gates via usePoEncounter context —
   only the active encounter renders.
   ----------------------------------------- */

const PaperPlaneEncounter = dynamic(() => import("./PaperPlaneEncounter"), {
  ssr: false,
});
const KnockEncounter = dynamic(() => import("./KnockEncounter"), {
  ssr: false,
});
const CodecRingEncounter = dynamic(() => import("./CodecRingEncounter"), {
  ssr: false,
});
const CursorStalkEncounter = dynamic(() => import("./CursorStalkEncounter"), {
  ssr: false,
});
const ZoneDropEncounter = dynamic(() => import("./ZoneDropEncounter"), {
  ssr: false,
});

export default function PoEncounterLayer() {
  return (
    <div
      className="po-encounter-layer"
      aria-live="polite"
      aria-label="Po encounter notifications"
    >
      <PaperPlaneEncounter />
      <KnockEncounter />
      <CodecRingEncounter />
      <CursorStalkEncounter />
      <ZoneDropEncounter />
    </div>
  );
}
