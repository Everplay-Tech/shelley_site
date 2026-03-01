"use client";

import { useState, useEffect } from "react";
import { PO_COSTUMES, type PoCostumeId, type PoAnimationSheet } from "@/lib/zone-config";

interface PoSpriteProps {
  costume?: PoCostumeId;
  size?: number;
  className?: string;
}

export default function PoSprite({
  costume = "default",
  size = 48,
  className = "",
}: PoSpriteProps) {
  const config = PO_COSTUMES[costume];
  const fallbackSheet: PoAnimationSheet = {
    id: "fallback",
    sheetPath: config.sheetPath,
    frames: 4,
    frameWidth: 64,
    frameHeight: 64,
  };

  const [sheet, setSheet] = useState<PoAnimationSheet>(
    config.sheets?.[0] ?? fallbackSheet
  );

  useEffect(() => {
    const sheets = config.sheets;
    if (sheets && sheets.length > 1) {
      const idx = Math.floor(Math.random() * sheets.length);
      setSheet(sheets[idx]);
    }
  }, [config.sheets]);

  const totalWidth = sheet.frames * sheet.frameWidth;
  const scale = size / sheet.frameHeight;
  const bgWidth = totalWidth * scale;
  const bgHeight = size;
  const fps = sheet.fps ?? 2.5; // Legacy 4-frame sheets default to 2.5fps
  const duration = sheet.frames / fps;

  return (
    <div
      className={`sprite-anim shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet.sheetPath})`,
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        "--sprite-offset": `-${bgWidth}px`,
        animation: `sprite-idle-dynamic ${duration}s steps(${sheet.frames}) infinite`,
      } as React.CSSProperties}
      aria-hidden="true"
      role="presentation"
    />
  );
}
