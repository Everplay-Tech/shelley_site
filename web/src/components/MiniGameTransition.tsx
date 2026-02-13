"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import GodotEmbed from "./GodotEmbed";
import { GodotEvent } from "@/lib/godot-messages";

const MiniGameTransition: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // This is a simplified version. In a real app, you might use a custom hook 
  // or wrap the router to trigger this.
  useEffect(() => {
    // Hide transition when pathname changes (navigation complete)
    setIsVisible(false);
    setPendingUrl(null);
  }, [pathname]);

  const handleGodotEvent = (event: GodotEvent) => {
    if (event.type === "minigame_complete" && pendingUrl) {
      router.push(pendingUrl);
    }
  };

  const skipTransition = () => {
    if (pendingUrl) {
      router.push(pendingUrl);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        skipTransition();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, pendingUrl]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <GodotEmbed gameName="po_runner" onEvent={handleGodotEvent} />
        <div className="mt-4 flex justify-between items-center text-white">
          <p>Po is traveling...</p>
          <button 
            onClick={skipTransition}
            className="px-4 py-2 bg-shelley-amber text-shelley-charcoal font-bold rounded hover:bg-yellow-400 transition-colors"
          >
            Skip (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniGameTransition;
