"use client";

import React, { useState } from "react";
import { useGodotBridge } from "@/hooks/useGodotBridge";
import { GodotEvent } from "@/lib/godot-messages";

interface GodotEmbedProps {
  gameName: string;
  onEvent?: (event: GodotEvent) => void;
  className?: string;
}

const GodotEmbed: React.FC<GodotEmbedProps> = ({ gameName, onEvent, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { iframeRef } = useGodotBridge(onEvent);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load game.");
  };

  return (
    <div className={`relative w-full aspect-video bg-shelley-charcoal rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-shelley-charcoal">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shelley-amber"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-shelley-charcoal text-white">
          <p>{error}</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`/games/${gameName}/index.html`}
        className="w-full h-full border-none"
        onLoad={handleLoad}
        onError={handleError}
        allow="autoplay; focus-without-user-activation"
      />
    </div>
  );
};

export default GodotEmbed;
