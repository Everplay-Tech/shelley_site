"use client";

import dynamic from "next/dynamic";
import PoSprite from "./PoSprite";
import type { PoCostumeId } from "@/lib/zone-config";

const PoDribble = dynamic(() => import("./PoDribble"), { ssr: false });
const PoSawHead = dynamic(() => import("./PoSawHead"), { ssr: false });
const PoPaintDump = dynamic(() => import("./PoPaintDump"), { ssr: false });
const PoCarrierPigeon = dynamic(() => import("./PoCarrierPigeon"), { ssr: false });
const PoScholar = dynamic(() => import("./PoScholar"), { ssr: false });

interface PoZoneAnimationProps {
  costume: PoCostumeId;
  size?: number;
  className?: string;
}

export default function PoZoneAnimation({
  costume,
  size = 128,
  className = "",
}: PoZoneAnimationProps) {
  const inner =
    costume === "default" ? (
      <PoDribble size={size} />
    ) : costume === "craftsman" ? (
      <PoSawHead size={size} />
    ) : costume === "artist" ? (
      <PoPaintDump size={size} />
    ) : costume === "messenger" ? (
      <PoCarrierPigeon size={size} />
    ) : costume === "scholar" ? (
      <PoScholar size={size} />
    ) : (
      <PoSprite costume={costume} size={size} />
    );

  return <div className={className}>{inner}</div>;
}
