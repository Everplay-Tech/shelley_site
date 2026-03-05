"use client";

import React from "react";
import { useGameSaves, type GameSave } from "@/hooks/useGameSaves";

interface SaveSlotPickerProps {
  gameName: string;
  onLoad: (saveData: Record<string, unknown>) => void;
  onSave: (slot: number) => void;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function SlotCard({
  slot,
  save,
  onLoad,
  onSave,
  onDelete,
}: {
  slot: number;
  save: GameSave | undefined;
  onLoad: (saveData: Record<string, unknown>) => void;
  onSave: (slot: number) => void;
  onDelete: (slot: number) => void;
}) {
  if (!save) {
    return (
      <div className="pixel-panel p-3 flex flex-col items-center gap-2 opacity-60">
        <span className="font-pixel text-[8px] text-shelley-amber tracking-wider">
          SLOT {slot}
        </span>
        <span className="font-pixel text-[7px] text-white/30">EMPTY SLOT</span>
        <button
          onClick={() => onSave(slot)}
          className="pixel-btn text-[7px] w-full"
        >
          SAVE HERE
        </button>
      </div>
    );
  }

  return (
    <div className="pixel-panel p-3 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-pixel text-[8px] text-shelley-amber tracking-wider">
          SLOT {slot}
        </span>
        <span className="font-pixel text-[6px] text-white/40">
          {formatTimestamp(save.updatedAt)}
        </span>
      </div>
      {save.label && (
        <span className="font-pixel text-[7px] text-white/70 truncate">
          {save.label}
        </span>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onLoad(save.saveData)}
          className="pixel-btn text-[7px] flex-1"
        >
          LOAD
        </button>
        <button
          onClick={() => onSave(slot)}
          className="pixel-btn text-[7px] flex-1"
        >
          SAVE
        </button>
        <button
          onClick={() => onDelete(slot)}
          className="pixel-btn-ghost text-[7px]"
        >
          DEL
        </button>
      </div>
    </div>
  );
}

const SaveSlotPicker: React.FC<SaveSlotPickerProps> = ({
  gameName,
  onLoad,
  onSave,
}) => {
  const { saves, isLoading, remove } = useGameSaves(gameName);

  if (isLoading) {
    return (
      <div className="pixel-panel p-4">
        <p className="font-pixel text-[8px] text-white/40 text-center tracking-wider">
          LOADING SAVES...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-pixel text-[8px] text-shelley-amber tracking-wider text-center">
        SAVE SLOTS
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((slot) => (
          <SlotCard
            key={slot}
            slot={slot}
            save={saves.find((s) => s.slot === slot)}
            onLoad={onLoad}
            onSave={onSave}
            onDelete={remove}
          />
        ))}
      </div>
    </div>
  );
};

export default SaveSlotPicker;
