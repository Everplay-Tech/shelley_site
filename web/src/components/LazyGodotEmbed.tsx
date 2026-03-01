"use client";

import React, { useState, useCallback, useRef, useEffect, forwardRef } from "react";
import dynamic from "next/dynamic";
import type { GodotEmbedHandle } from "@/components/GodotEmbed";
import type { GodotEvent } from "@/lib/godot-messages";

// Dynamic import — GodotEmbed's iframe + bridge logic only loads when triggered
const GodotEmbed = dynamic(() => import("@/components/GodotEmbed"), {
  ssr: false,
});

type LoadStrategy = "click" | "viewport" | "eager";

interface LazyGodotEmbedProps {
  gameName: string;
  onEvent?: (event: GodotEvent) => void;
  className?: string;
  /** When true, fills parent container instead of aspect-video */
  fullScreen?: boolean;
  /** How to trigger loading. Default: "click" */
  loadStrategy?: LoadStrategy;
  /** Label on the play button placeholder */
  playLabel?: string;
  /** Subtitle under the play button */
  playSubtitle?: string;
}

/**
 * Lazy wrapper around GodotEmbed.
 *
 * Strategies:
 *   - "click"    → show pixel-art PLAY placeholder, mount iframe on click (default)
 *   - "viewport" → mount when scrolled into view (IntersectionObserver, 200px margin)
 *   - "eager"    → passthrough, mount immediately
 *
 * Any new page just imports LazyGodotEmbed instead of GodotEmbed
 * and lazy loading is automatic.
 */
const LazyGodotEmbed = forwardRef<GodotEmbedHandle, LazyGodotEmbedProps>(
  function LazyGodotEmbed(
    {
      gameName,
      onEvent,
      className,
      fullScreen,
      loadStrategy = "click",
      playLabel = "PLAY",
      playSubtitle,
    },
    ref
  ) {
    const [loaded, setLoaded] = useState(loadStrategy === "eager");
    const containerRef = useRef<HTMLDivElement>(null);

    // IntersectionObserver for "viewport" strategy
    useEffect(() => {
      if (loadStrategy !== "viewport" || loaded) return;
      const el = containerRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setLoaded(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [loadStrategy, loaded]);

    const handlePlay = useCallback(() => setLoaded(true), []);

    // ── Placeholder (click-to-load) ──
    if (!loaded) {
      return (
        <div
          ref={containerRef}
          className={`relative bg-shelley-charcoal overflow-hidden ${
            fullScreen ? "w-full h-full" : "w-full aspect-video scanlines"
          } ${className ?? ""} flex items-center justify-center cursor-pointer group`}
          onClick={handlePlay}
          role="button"
          tabIndex={0}
          aria-label={`Load ${gameName.replace(/_/g, " ")} game`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePlay();
            }
          }}
        >
          <div className="flex flex-col items-center gap-3 transition-transform group-hover:scale-105">
            {/* Play triangle */}
            <div className="w-14 h-14 border-2 border-shelley-amber/30 rounded-full flex items-center justify-center group-hover:border-shelley-amber/60 transition-colors">
              <span
                className="text-shelley-amber/50 text-xl ml-0.5 group-hover:text-shelley-amber transition-colors"
                aria-hidden="true"
              >
                &#9654;
              </span>
            </div>
            <span className="font-pixel text-[9px] text-shelley-amber/40 tracking-wider group-hover:text-shelley-amber/70 transition-colors">
              {playLabel}
            </span>
            {playSubtitle && (
              <span className="font-pixel text-[6px] text-white/15 tracking-wider">
                {playSubtitle}
              </span>
            )}
          </div>
        </div>
      );
    }

    // ── Live game ──
    return (
      <GodotEmbed
        ref={ref}
        gameName={gameName}
        onEvent={onEvent}
        className={className}
        fullScreen={fullScreen}
      />
    );
  }
);

export default LazyGodotEmbed;
