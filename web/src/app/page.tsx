"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import GodotEmbed from "@/components/GodotEmbed";
import type { GodotEmbedHandle } from "@/components/GodotEmbed";
import GameBoyControls from "@/components/GameBoyControls";
import { getLandingGame, ONBOARDING_COOKIE } from "@/lib/game-routes";
import { hasCookie, setCookie } from "@/lib/cookies";
import { reportGameEvent } from "@/lib/player-state";
import { usePlayerState } from "@/hooks/usePlayerState";
import type { GodotEvent } from "@/lib/godot-messages";
import { emitGameEvent } from "@/lib/game-events";

type GameScreen = "loading" | "welcome" | "controls" | "playing" | "done";

export default function Home() {
  const { progress } = usePlayerState();
  const [showGame, setShowGame] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [gameConfig, setGameConfig] = useState(() => getLandingGame(false));
  const [screen, setScreen] = useState<GameScreen>("loading");
  const [isMobile, setIsMobile] = useState(false);
  const [isNarrative, setIsNarrative] = useState(false);
  const embedRef = useRef<GodotEmbedHandle>(null);

  useEffect(() => {
    // Detect mobile/touch device
    const touch =
      navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    setIsMobile(touch);
  }, []);

  useEffect(() => {
    // Check both cookie (legacy) and server state
    const returning = hasCookie(ONBOARDING_COOKIE) || progress.onboardingComplete;
    setGameConfig(getLandingGame(returning));
    if (returning) {
      setShowGame(false);
      setScreen("done");
    }
  }, [progress.onboardingComplete]);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
    switch (event.type) {
      case "game_ready":
        // Godot loaded — transition from loading spinner to welcome screen
        setScreen((prev) => (prev === "loading" ? "welcome" : prev));
        break;
      case "narrative_start":
        setIsNarrative(true);
        break;
      case "narrative_end":
        setIsNarrative(false);
        break;
      case "onboarding_complete":
        reportGameEvent({ type: "onboarding_complete", gameName: "po_runner" });
        setCookie(ONBOARDING_COOKIE, "1");
        setScreen("done");
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setShowGame(false), 800);
        }, 2000);
        break;
      case "player_state":
        if ("data" in event) {
          reportGameEvent({
            type: "score_update",
            gameName: "po_runner",
            score: event.data.score,
          });
        }
        break;
      default:
        break;
    }
  }, []);

  const handlePlay = useCallback(() => {
    setScreen("controls");
  }, []);

  const handleStart = useCallback(() => {
    setScreen("playing");
    embedRef.current?.sendCommand({ command: "start" });
  }, []);

  const handleSkip = useCallback(() => {
    reportGameEvent({ type: "skipped", gameName: "po_runner" });
    setScreen("done");
    setFadeOut(true);
    setTimeout(() => setShowGame(false), 600);
  }, []);

  const sendCommand = useCallback(
    (cmd: Parameters<GodotEmbedHandle["sendCommand"]>[0]) => {
      embedRef.current?.sendCommand(cmd);
    },
    []
  );

  return (
    <>
      {/* Full-screen game overlay — covers everything including nav */}
      {showGame && (
        <div
          className={`fixed inset-0 z-[100] bg-black transition-opacity duration-700 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Game iframe — always mounted, loads in background */}
          <div className="absolute inset-0">
            <GodotEmbed
              ref={embedRef}
              gameName={gameConfig.gameName}
              onEvent={handleGodotEvent}
              fullScreen
            />
          </div>

          {/* ─── WELCOME SCREEN ─── */}
          {screen === "welcome" && (
            <div className="absolute inset-0 z-[102] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-8 px-6 text-center max-w-md">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-shelley-amber mb-2">
                    WELCOME!
                  </h1>
                  <p className="text-xl sm:text-2xl font-bold text-white/90">
                    To our LABS!!!
                  </p>
                </div>

                <p className="text-sm text-white/50 font-mono">
                  Choose to play or skip intro. Have a nice day
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button
                    onClick={handlePlay}
                    className="px-8 py-3 bg-shelley-amber text-black font-bold text-lg rounded hover:bg-shelley-amber/90 transition-colors"
                  >
                    PLAY
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-8 py-3 bg-white/10 text-white/60 font-bold text-lg rounded hover:bg-white/20 hover:text-white/80 transition-colors"
                  >
                    SKIP INTRO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── CONTROLS SCREEN ─── */}
          {screen === "controls" && (
            <div className="absolute inset-0 z-[102] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-8 px-6 text-center max-w-md">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  CONTROLS
                </h2>

                {isMobile ? (
                  /* Mobile controls preview */
                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#2C2C2C] border border-white/20 flex items-center justify-center text-white/70 text-xl font-bold">
                          ↓
                        </div>
                        <span className="text-white/70 font-mono text-sm">SLIDE</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/70 font-mono text-sm">JUMP</span>
                        <div className="w-12 h-12 rounded-full bg-[#2C2C2C] border border-white/20 flex items-center justify-center text-shelley-amber font-bold text-lg">
                          A
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 font-mono">
                      On-screen buttons appear during gameplay
                    </p>
                  </div>
                ) : (
                  /* Desktop controls */
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                      <span className="text-white/70 font-mono text-sm">JUMP</span>
                      <div className="flex gap-2">
                        <kbd className="px-3 py-1.5 bg-white/10 rounded text-white/80 font-mono text-sm border border-white/20">
                          SPACE
                        </kbd>
                        <kbd className="px-3 py-1.5 bg-white/10 rounded text-white/80 font-mono text-sm border border-white/20">
                          ↑
                        </kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                      <span className="text-white/70 font-mono text-sm">SLIDE</span>
                      <div className="flex gap-2">
                        <kbd className="px-3 py-1.5 bg-white/10 rounded text-white/80 font-mono text-sm border border-white/20">
                          ↓
                        </kbd>
                        <kbd className="px-3 py-1.5 bg-white/10 rounded text-white/80 font-mono text-sm border border-white/20">
                          S
                        </kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                      <span className="text-white/70 font-mono text-sm">ADVANCE</span>
                      <div className="flex gap-2">
                        <kbd className="px-3 py-1.5 bg-white/10 rounded text-white/80 font-mono text-sm border border-white/20">
                          ENTER
                        </kbd>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStart}
                  className="px-10 py-3 bg-shelley-amber text-black font-bold text-lg rounded hover:bg-shelley-amber/90 transition-colors"
                >
                  START
                </button>
              </div>
            </div>
          )}

          {/* ─── LOADING SPINNER ─── */}
          {screen === "loading" && (
            <div className="absolute inset-0 z-[102] flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shelley-amber" />
                <span className="text-white/40 text-sm font-mono">
                  Loading...
                </span>
              </div>
            </div>
          )}

          {/* ─── GAMEBOY CONTROLS (mobile, during gameplay) ─── */}
          {screen === "playing" && isMobile && (
            <GameBoyControls
              sendCommand={sendCommand}
              isNarrative={isNarrative}
            />
          )}

          {/* Skip button during gameplay */}
          {screen === "playing" && (
            <button
              onClick={handleSkip}
              className="absolute bottom-4 right-4 z-[101] px-3 py-1.5 text-xs font-mono text-white/30 hover:text-white/70 bg-black/30 hover:bg-black/50 rounded backdrop-blur-sm transition-all"
            >
              Skip Intro
            </button>
          )}
        </div>
      )}

      {/* Site content — revealed after game completes or is skipped */}
      <div className="flex flex-col gap-12">
        <section className="text-center py-20">
          <h2 className="text-6xl font-black mb-6 tracking-tight">
            CRAFTING <span className="text-shelley-amber">SOUND</span>, <br />
            BUILDING <span className="text-shelley-amber">LEGENDS</span>.
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Handcrafted guitars built with intention. Explore the workshop.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">The Workshop</h4>
            <p className="text-white/60 mb-6">Take a look inside the shop where every Shelley guitar is born.</p>
            <a href="/workshop" className="text-shelley-amber font-medium hover:underline">Go to Workshop &rarr;</a>
          </div>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">The Gallery</h4>
            <p className="text-white/60 mb-6">Browse our completed works and custom orders.</p>
            <a href="/gallery" className="text-shelley-amber font-medium hover:underline">View Gallery &rarr;</a>
          </div>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">About Us</h4>
            <p className="text-white/60 mb-6">Learn about the philosophy and hands behind the brand.</p>
            <a href="/about" className="text-shelley-amber font-medium hover:underline">Learn More &rarr;</a>
          </div>
        </div>
      </div>
    </>
  );
}
